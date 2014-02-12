(function () {

    // this file contains patches to the Forio libraries that are being retrofitted to previous
    // versions so two functions are replaced to handle & character when uploading users and passwords
    // version 1.14 of F lib contains this fixes
    if(F && F.API && F.API.UserGroup) {
        var userGroupUrl = F.APIUtils.getURL("usergroup");

        F.API.UserGroup.add = function(userList, callback,  options, group){
            var newurl =  (group) ?  userGroupUrl + "/" + group: userGroupUrl;
            var defaults = {
                onError: function(status, message){
                    // Errors come with different parameters
                    if(status.status && status.message) {
                        callback(status.message, status.status); 
                    }
                    else {
                        callback(message, status);  
                    }
                },
                parameterParser: $.param
            }
            // force APIConnection to use jQuery paramter parser instead of its own
            // since it is more robust to handle special characters in names, passwords, etc.
            var ac = new APIConnection(newurl, null, defaults);

            var params = {
                action: "addUsers",
                content: userList
            };

            $.extend(params, options);
            ac.post(params , callback); //Dry run to see if there are any errors
        };
    }

    if(F && F.API && F.API.Auth) {
        var url = function(){ return F.APIUtils.getURL("authentication"); };
        F.API.Auth.login = function(email,password,callback, options){
            var params = "user_action=login&email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password);

            var defaults = {
                parameterParser: null,
                onError: function(errorMess, errorThrown, responseText){
                    var response = $.parseJSON(responseText);
                    callback(response);
                } //Call the login handler anyway with the status code
            };
            $.extend(defaults, options);

            var ac = new APIConnection(url, defaults.params , defaults);
            return  ac.post(params , callback);
        };
    }

})();
