/**  Usergroup API operations.
 *  @static
 *  @class UserGroup
 *  @namespace F.API
 */
F.API.UserGroup = (function(){
	var url = F.APIUtils.getURL("usergroup");
	return{
		add:function(userList, callback, options){
			var defaults = {
				onError: function(status, message){
					callback(message);
				}
			}
			var ac = new APIConnection(url);

			var params = {
				action: "addUsers",
				content: userList
			}
			$.extend(params, options);
			ac.post(params , callback); //Dry run to see if there are any errors
		},

		setPermission:function(filter , callback, options){
			var ac = new APIConnection(url, options);
				ac.getJSON(filter , callback);
		},

		setRunLimit: function(){

		},
		clearRunCount: function(){

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
			var qs = $.extend(actions, F.makeObject(params));

			var ac = new APIConnection(url, options);
				ac.post(qs, callback);
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
