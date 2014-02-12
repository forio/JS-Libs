/**  Archive API operations.
 *  See http://sites.google.com/a/forio.com/documentation/api-documentation/api-archive for list of supported params
 *  @static
 *  @class Archive
 *  @namespace F.API
 */
F.API.UserGroup = (function(){
	var url = F.APIUtils.getURL("usergroup");
	return{
		/**
		 * Add user to existing group
		 * @param {Object} userList
		 * @param {Object} callback
		 * @param {Object} options
		 * @param {Object} group
		 */
		add:function(userList, callback,  options, group){
            var newurl =  (group) ?  url + "/" + group: url;
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
		},
		remove: function(userList, group, callback, options){
			var newurl =  (group) ?  url + "/" + group:  url;
			var params = {
				action: "removeUsers",
				user: userList
			}

			var ac = new APIConnection(newurl, options);
				ac.post(params , callback);
		},
		setPermission:function(filter , callback, options){
			var ac = new APIConnection(url, options);
				ac.getJSON(filter , callback);
		},

		/**
		 * @param {Object} grpName
		 * @param {Object} params : description/singleSignOnOnly/allowUpload
		 * @param {Object} callback
		 * @param {Object} options
		 */
		createGroup: function(grpName, params, callback, options){
			var newurl =   url + "/" + grpName;

			var defaultParams = {
				method: "PUT"
			}
			$.extend(defaultParams, params);

			var defaultOptions = {
				onError: function(response){

				}
			}
			$.extend(defaultOptions, options);

			var ac = new APIConnection(newurl, "", defaultOptions);
				ac.post(defaultParams , callback);
		},
		getInfo: function(grpName, callback, options, apioptions){
			grpName || (grpName = "")

			var ac = new APIConnection(url + "/" + grpName, options, apioptions);
				ac.getJSON("" , callback);
		},
		setUserParams: function(grpName, targetUser, params, callback, options){
			//params.team and params.role
			//no action
			var ac = new APIConnection(url + "/" + grpName + "/" + targetUser, options);
				ac.post(params , callback);

		},
		resetRunLimit: function(runLimit, callback, options){
			var qs = "action=clearRunCount";
			//TODO: Make simulate do this with the same API call
			if(runLimit !== undefined && runLimit !== null){
				var oldcallback = callback;
				callback = function(){
					F.API.UserGroup.setRunLimit(runLimit, oldcallback, options);
				}
			}
			var ac = new APIConnection(url, options);
				ac.post(qs , callback);
		},

		setRunLimit: function(runLimit, callback, options){
			var qs = "action=setRunLimit&value=" + runLimit;
			var ac = new APIConnection(url, options);
				ac.post(qs , callback);
		},

		/** Email lost passwords. For use by admins
		 * @param {String} loginid login of user to retreive for
		 * @param {Function} callback function (optional)
		 * @param {*} options (optional)
		 */
		sendPassword: function(loginid, callback, options){
			var qs = "action=emailUserPasswords&user=" + loginid;
			var ac = new APIConnection(url, options);
				ac.post(qs , callback);
		},

		setRoles: function(group, roles, callback, options){
			var qs = "action=setRoles&value=" + roles;
			var ac = new APIConnection(url +"/" + group, options);
				ac.post(qs , callback);
		},
		doActions: function(actions, params, callback, options){
			var actionsQs= {
				"action" : [].concat(actions)
			}
			var qs = $.extend(actionsQs, F.makeObject(params));

			var ac = new APIConnection(url, options);
				ac.post(qs, callback);
		}

	}
}());

F.API.User = (function(){
	var url = F.APIUtils.getNonSimURL("user");
	return{
		/**
		 *
		    * firstName
		    * lastName
		    * organizationName  (optional)
		    * team              (optional, number)
		    * role              (optional)
		    * facilitator       (optional, true/false)
		    * cbUserId          (must be logged in as author or admin)
		    * administrator     (true/false, must be logged in as administrator)
		 * @param {Object} email
		 * @param {Object} pass
		 * @param {Object} callback
		 * @param {Object} options
		 */
		create: function(email, pass, firstName, lastName, params, callback, options){
			var defaults = {
				email: encodeURIComponent(email),
				password: pass,
				firstName: firstName,
				lastName: lastName,
				facilitator: false,
				simulation: "/" + F.APIUtils.userPath + "/" + F.APIUtils.simPath
			}
			$.extend(defaults, params);

			var qs = F.makeQueryString(defaults);

			var defaultOptions ={
				parameterParser: null
			}
			$.extend(defaultOptions, options);

			var ac = new APIConnection(url, "", defaultOptions);
				ac.post(qs , callback);

		}
	}
}());

F.API.File = (function(){
	var url = F.APIUtils.getURL("file");
	return{
		getList: function(path, callback, options){
			var ac = new APIConnection(url + "/" + path, options);
				ac.get("" , function(response){
					var files = response.files;
					(callback || $.noop)(files);
				});
		}
	}
}());


F.API.Email = (function(){
	var url = F.APIUtils.getURL("email");
	return{
		send: function(to, subject, body, callback, options){
			var qs = {to: to, subject: subject, body: body};
			var ac = new APIConnection(url, options);
				ac.post(qs, callback);
		},

		sendFile: function(to, subject, filepath, callback, options){
			var qs = {to: to, subject: subject, file: filepath};
			var ac = new APIConnection(url, options);
				ac.post(qs, callback);
		}
	}
}());
