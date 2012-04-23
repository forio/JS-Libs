/**
 * @module Net
 * @author Naren
 */

/** Wrapper around AjaxConnection specifically for talking to any Simulate API
 * @class APIConnection
 * @constructor
 * @extends AjaxConnection
 * @requires AjaxConnection, F, F.APIUtils
 * @param {String || Function} url API location, or a function which returns the location
 * @param {String|Array|Object|HTMLElem|Mixed} params  URLParams to be included as part of the url string
 * @param {Object} settings Additional settings to be passed to ajax conn object. Use to define error handlers
 */
var APIConnection = function(url, params, settings){
	if(!url){
		throw new Error("APIConnection: no url provided");
	}
	if($.isFunction(url)){
		url = url();
	}
	var dataType = "json"; //Api returns json unless diff target file specified
	var defaults = {
		/** Return this file on success
		 * @config target
		 * @type String
		 */
		target: ""
	}
	$.extend(defaults, params);
	
	if(defaults.target){
		var absURL = "/" + F.APIUtils.userPath + "/" + F.APIUtils.simPath + "/" + params.target;
		params.target = encodeURIComponent(absURL);
		
		dataType = "text"; //We don't know what target file content will be any longer
	}
	url += "?" + F.makeQueryString(params, {encode:false}); // Make escaped target a part of url
	
	var handleError = function(errorMessage, errorThrown){
		var status = errorMessage.status;
		var message = errorMessage.message;
		
		var authErrorHandler = function(message){
			window.location = "index.html"; // Hoping you have your index private and simulate redirects you to a login page
		};
		
		var defaultErrorHandler = function(errorMessage, errorThrown){
			if(F.API.DEBUG_MODE){
				if(window.console && window.console.error){
					window.console.error(errorMessage, errorThrown);
				}
				else{
					alert(status + ":"  + message);
				}
			}
			else{
				//Production so call logging api
				F.API.Log.error(errorMessage, url);
			}
		};
		
		switch(status){
			case 401: 
				authErrorHandler(message);
				break;
			default:
				defaultErrorHandler(errorMessage, errorThrown);
				break;
		}
	}
	
	var defaultSettings = {
		onError: handleError,
		parameterParser: F.makeQueryString
	}
	$.extend(defaultSettings, settings);
	
	var ac =  new AjaxConnection(url, defaultSettings, {dataType: dataType});
		ac.put = function(params, callback, options){
			var defaults = {
				type: (params) ? 'POST' : 'GET',
				data: F.makeQueryString(params) + "&method=put",
				parameterParser: null
			}
			$.extend(defaults, options);
			$.extend(defaultSettings, defaults);
			this.connect(defaults, callback);
		},
		ac.del = function(params, callback, options){
			var defaults = {
				type: (params) ? 'POST' : 'GET',
				data: F.makeQueryString(params) + "&method=delete",
				parameterParser: null
			}
			$.extend(defaults, options);
			$.extend(defaultSettings, defaults);
			this.connect(defaults, callback);
		}
	return ac;
};


/** Utility functions for the API adaptors
 *  @static
 *  @class APIUtils
 *  @namespace F
 */
F.APIUtils =  (function(){
	
	/* We need the following because the simulate URL structure changed (9/2010).  
	 * First we need to determine whether we need to use the old URL regexp or the new URL regexp.
	 * Next we need to use the proper regexp to breakup the url of the current page
	 */
	var urlRegExp;
	
	//http://forio.com/simulate/simulation/cdc/health-bound/abc.swf
	var simRegExpOld = /(http|https|file):\/\/([^\/]+)\/([^\/]+)\/simulation\/([^\/]+)\/([^\/]+)\/?/;
	//http://forio.com/simulate/cdc/health-bound/simulation/abc.swf
	var simRegExpNew = /(http|https|file):\/\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/simulation\/?/;
	//http://forio.com/simulate
	var managerRegExp = /(http|https|file):\/\/([^\/]+)\/([^\/]+)\/?/;
	
	var usingManagerRegExp = false
	//need to flag when using manager one because it will not return a userPath or simPath
	if(simRegExpNew.test(window.location)){
		urlRegExp = simRegExpNew
	}
	else if(simRegExpOld.test(window.location)){
		urlRegExp = simRegExpOld
	}
	else{
		usingManagerRegExp= true;
		urlRegExp = managerRegExp;
	}

	var result = urlRegExp.exec(window.location) || [];
	return{
		/** Protocol used
		 * @property protocol
		 * @type String 
		 */
		protocol: result[1],
		
		basePath : result[1] + "://" + result[2],
		
		/** Domain of the sim
		 * @property domain
		 * @type String
		 */
		domain: result[2],
		
		/** section of URL referencing simulate 
		 * @property simulatePath
		 * @type String 
		 */
		simulatePath : result[3],
		
		/** Simulation author
		 * @property userPath
		 * @type String 
		 */
		userPath : usingManagerRegExp ? "" : result[4],
		
		/** Simulation name
		 * @property simPath
		 * @type String Name of sim 
		 */
		simPath : usingManagerRegExp ? "" : result[5],
		
		/** Enter in api type to get url
		 * @param {String} apiType  Currently run||archive||data||auth
		 * @return {String} absolute path to API
		 */
		getURL: function(apiType){
			var me = this;
			var url = me.protocol + "://" + me.domain + "/" + me.simulatePath + "/api/" + apiType + "/" + me.userPath + "/" + me.simPath;
			return url;
		},
	
		getNonSimURL: function(apiType){
			var me = this;
			var url = me.protocol + "://" + me.domain + "/" + me.simulatePath + "/api/" + apiType;
			return url;
		}
	}
}());

/** Adpators to perform operations on all Forio APIs.
 * @module API
 * @see http://sites.google.com/a/forio.com/documentation/api-documentation
 */
F.API = {
	/** Set to true to avoid posting errors to log api and print to console instead. Defaults to true for dev and test accounts.
	 * @property DEBUG_MODE
	 * @type Boolean
	 */
	DEBUG_MODE: (F.APIUtils.simPath.indexOf("-dev") !== -1 || F.APIUtils.simPath.indexOf("-test") !== -1)
};

/** Perform operations on the Data API
 *  @static
 *  @class Data
 *  @namespace F.API
 */
F.API.Data = (function(){
	var isKeyValid = function(key){
		//A-Z and a-z, digits 0-9, an underscore, or a dash
		//TODO: Regex this
		return true;
	}
	
	var getDataVal = function(value){
		var dataVal;
		try{
			dataVal = F.Object.serialize( F.makeObject(value) ); //Are we posting an object
		}
		catch(e){
			if(F.isString(value) || F.isNumber(value)){
				dataVal = value;
			}
			else{
				try{
					dataVal = F.stringify(value);
				}
				catch(e){
					throw new Error(e, 227, "Data API: Api.js; unknown format");
				}
			}
		}
		
		return encodeURIComponent(dataVal);
	}
	
	var url = function(key){return F.APIUtils.getURL("data") + "/" + key};
	
	return{
		/** Save values to the data API. Assume object is single tuple as in "a=b" or "{a:b}" which posts 'b' to <URL>/a
		 * @param {Mixed} params stuff to save
		 */
		save: function(params, callback, options, apioptions){
			params = F.makeObject(params);
			var dataKey, dataVal;
			for(var prop in params){ //Assume object just has the one key
				dataKey = prop;
				dataVal = params[prop];
			}
			this.saveAs(dataKey, dataVal, callback, options, apioptions);
		},
		
		//TODO: simulate auto unescapes stuff before passing it on- replace " with /"
		/** Saves values to the specified key. Supports complicated object structures
		 * @param {String} key Key to save data under
		 * @param {*} value things to save
		 * @param {Function} callback function (optional)
		 * @param {*} options (optional)
		 * 
		 */
		saveAs: function(key, value, callback, options, apioptions){
			if(!isKeyValid(key)){
				throw new Error("Data.save: Invalid key " + key );
			}
			
			var actualOptions = $.extend(true, {parameterParser: null}, apioptions)
			var dataVal = getDataVal(value);
			//UGH: simulate gotcha no.12312: What? You want case insensitive url params? surely you jest
			var val =  "data_action=SETPROPERTY&value=" + dataVal;
			var ac = new APIConnection(url(key), options, actualOptions);
				ac.post(val, callback);
		},
		
		/** Pushes a value to the end of an arrar **/
		push: function(key, value, callback, options, apioptions){
			if(!isKeyValid(key)){
				throw new Error("Data.save: Invalid key " + key );
			}
			var dataVal = getDataVal(value);
			var val =  "data_action=PUSH&value=" + dataVal;
			
			var actualOptions = $.extend(true, {parameterParser: null}, apioptions)
			var ac = new APIConnection(url(key), options, actualOptions);
				ac.post(val, callback);
		},
		
		/** Load data from the API
		 * @param {String} key location to load data from
		 * @param {Function} callback - Gets called with data object
		 * @param {*} options
		 */
		load: function(key, callback, options, apioptions){
			var ac = new APIConnection(url(key), options, apioptions);
				ac.getJSON("", function(response){
					var data = (response.data) ? response.data : ( (response.users) ? response.users : response ) ;
					(callback || $.noop)(data);
				});
		},
		
		/** Removes items from the data API
		 * @param {String} key location to delete
		 * @param {Function} callback 
		 * @param {*} options
		 */
		remove: function(key, callback, options, apioptions){
			var ac = new APIConnection(url(key), options, apioptions);
				ac.post("method=Delete", function(response){
					(callback || $.noop)(response);
				});
		},
		
		/** Generic connection handler, does no params by default
		 * @param {String} key
		 * @param {*} params params to post
		 * @param {Function} callback 
		 * @param {*} options
		 */
		connect: function(key, params, callback, options, apioptions){
			var ac = new APIConnection(url(key), options, apioptions);
				ac.post(params, function(response){
					(callback || $.noop)(response);
				});
		}
	}
}());

/** Perform operations on runs
 *  @static
 *  @class Run
 *  @namespace F.API
 */
F.API.Run = (function(){
	var url = function(){return F.APIUtils.getURL("run")};
	//Converts the returns array to a key-value pair for easy js retreival later
	//IMPROVE: Make simulate do this for you;
	var prettifyValsArray = function(valsArray){
		var variableList = {};
		var valsArray = [].concat(valsArray);
		
		for(var i=0; i < valsArray.length; i++){
			var thisItem = valsArray[i];
			var varname = thisItem.name.toLowerCase();
			
			variableList[varname] = {};
			for(var key in thisItem){
				if(key !== "name"){
					variableList[varname][key] = thisItem[key];
				}
			}
		}
		return variableList;
	}
	
	return {
		/** Save Decisions
		 * @param {Mixed} values values to save
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		saveValues: function(values, callback, options, connOptions){
			var ac = new APIConnection(url, options, connOptions);
				ac.post(values, callback);
		},
		
		/** Set properties of current run; name, desc, etc
		 * @param {Mixed} properties properties to set, can take multiple
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		setProperties:function(properties, callback, options, apioptions){
			properties = F.makeQueryString(properties, {seperator: ":", encode: false});
			var propQs= {
				"run_set" : properties.split("&")
			}
			var ac = new APIConnection(url, options, apioptions);
				ac.post(propQs, callback);
		},
		
		/** Perform run actions; step, clone etc
		 * @param {String||Array} actions one or more actions to set
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		doActions: function(actions, runid, callback, options, apioptions){
			var actionsQs= {
				"run_action" : [].concat(actions)
			}
			if(runid)
				$.extend(actionsQs, {run:runid});
			var ac = new APIConnection(url, options, apioptions);
				ac.post(actionsQs, callback);
		},
		
		/** Get Information about current run
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return callback({Object}) the run object
		 */
		getInfo:function(callback, options, apioptions){
			var ac = new APIConnection(url, options, apioptions );
				ac.getJSON("", callback);
		},
		
		/** Get values for the variables provided. 
		 *  @param {Array|String} varnames Variables to get value for
		 *  @param {Function} callback callback
		 *  @param {*} params query parameters to include
		 *  @param {*} connOptions APIConnection options
		 *  @return callback({Object}) Run object with 'values' as a hash
		 */
		getValues: function(varnames, callback, params, connOptions){
			var defaultRunOptions = {
				exactMatch: true
			}
			$.extend(defaultRunOptions, connOptions);
			
			var vars = [].concat(varnames);
			for(var i=0; i< vars.length; i++){
				if(vars[i].match(/\^|\$/) && defaultRunOptions.exactMatch === true){
					//They threw in exact matches themselves, so let me be nice and turn exact matching off for them.
					defaultRunOptions.exactMatch = false;
					if(console && console.warn){
						console.warn(vars[i], "- This variable name had special characters in it, so exact matching was turned off.")
					}
				}
				vars[i] = encodeURIComponent(F.Template.compile(vars[i]));
			}
			
			var varlist = (defaultRunOptions.exactMatch === true) ? "^" + vars.join("$,^") + "$" : vars.join(",");
			var qs= "variables=" + varlist;
			
			var defaultParams = {
				format: "concise"
			}
			$.extend(defaultParams, params);
			
			var defaultConnOptions = {
				parameterParser: null
			}
			$.extend(defaultConnOptions, connOptions);
			
			var ac = new APIConnection(url, defaultParams, defaultConnOptions );
				ac.getJSON(qs, function(response){
					var run = $.extend(true, {}, response.run);
					run.values = prettifyValsArray(run.values);
					
					(callback || $.noop)(run);
				});
		} ,
		
		/** Generic connection handler, does no params by default
		 * @param {String} key
		 * @param {*} params params to post
		 * @param {Function} callback 
		 * @param {*} options
		 */
		connect: function(params, callback, apioptions, connoptions){
			var ac = new APIConnection(url, apioptions, connoptions);
				ac.post(params, callback);
		},
		
		//Common Actions
		/** Clone run. Use 'target' param to point to a file with $Run.RunId to make it return new RunId
		 * @param {String} runId the run to clone
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		clone: function(runId, callback, options, apioptions){
			if(!runId){
				throw new Error("Run.clone: No source run provided");
			}
			this.doActions("clone", runId, callback, options, apioptions);
		},
		
		/** Reset run to initial
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		reset: function(callback, options, apioptions){
			this.doActions("reset", "", callback, options, apioptions);
		},
		
		/** Advance Run. Just do doActions("step") if you just want to step once. Same as "doActions('step_to_x')"
		 * @param {String || Number} step the step to advance to
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 */
		stepTo: function(step, callback, options, apioptions){
			if(!step){
				throw new Error("Run.stepTo: No step provided");
			}
			this.doActions("step_to_"+ step, "", callback, options, apioptions);
		}
	}
}());

F.API.Log = (function(){
	var url = function(){return F.APIUtils.getURL("log")};
	
	var log = function(severity, msg, errorURL,simulateEventType){
		if(F.isObject(msg)) msg = msg.message;
		
		if(errorURL.indexOf("/log/") !== -1){
			return false;
			//Don't log errors about the log API. Fair enough.
		}
		var params = {
			level: severity,
			simulateEventType: simulateEventType,
			url: errorURL,
			message: msg
		}
		var ac = new APIConnection(url);
			ac.post(params)
	}
	return{
		error: function(msg, errorURL, simulateEventType){
			log("error", msg, errorURL, simulateEventType);
		},
		debug: function(msg, errorURL, simulateEventType){
			log("debug", msg, errorURL, simulateEventType);
		}
	}
}())

/** Handles Authentication.
 *  @class Auth
 *  @static
 *  @namespace F.API
 */
F.API.Auth = (function(){
	var url = function(){return F.APIUtils.getURL("authentication")};
	return{
		/** Login to the simulation
		 * @param {String} email 
		 * @param {String} password
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return {}
		 */
		login: function(email,password,callback, options){
			var params = "user_action=login&email=" + encodeURIComponent(email) + "&password=" + password;
			
			var defaults = {
				parameterParser: null,
				onError: function(errorMess, errorThrown, responseText){
					var response = $.parseJSON(responseText);
					callback(response);
				} //Call the login handler anyway with the status code
			};
			$.extend(defaults, options);
			
			var ac = new APIConnection(url, defaults.params , defaults);
				ac.post(params , callback);
		},
		
		impersonate: function(user, group, callback, options){
			var params = "user_action=impersonate&username=" + encodeURIComponent(user);
			if(group) params += "group="+ group;
			
			var defaults = {
				parameterParser: null
			};
			$.extend(defaults, options);
			
			var ac = new APIConnection(url, defaults.params, defaults);
				ac.post(params , callback);
		},
		unimpersonate: function(callback, options){
			var params = "user_action=unimpersonate";
			var defaults = {parameterParser: null};
			$.extend(defaults, options);
			var ac = new APIConnection(url, defaults.params, defaults);
				ac.post(params , callback);
		},
		
		createAnonAccount: function(firstName, lastName, callback, apioptions){
			var params = {
				user_action: "anonymous_login",
				firstName:firstName, 
				lastName: lastName
			}
			var ac = new APIConnection(url, "", apioptions);
				ac.post(params , callback);
		},
		/** Logout from the simulation
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return {}
		 */
		logout: function(callback, options){
			var params = "user_action=logout";
			var defaults = {parameterParser: null};
			$.extend(defaults, options);
			var ac = new APIConnection(url, defaults.params, defaults);
				ac.post(params , callback);
		},
		
		loginGroup: function(grpName, callback, options){
			var params = "user_action=changeGroup&userGroup=" + encodeURIComponent(grpName);
			var defaults = {
				parameterParser: null
			};
			$.extend(defaults, options);
			
			var ac = new APIConnection(url, defaults.params , defaults);
				ac.post(params , callback);
		},
		/** Check if you're currently logged in
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return callback({Boolean})
		 */
		isUserLoggedIn: function(callback, options, apioptions){
			var ac = new APIConnection(url);
				ac.getJSON("", function(response){
					(callback || $.noop)(response && response.canRunSim);				
				});
		},
		
		/** Information about currently logged-in user
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return callback({Object}) Object representing user info
		 */
		getUserInfo: function(callback, options, apioptions){
			var ac = new APIConnection(url);
				ac.getJSON("",callback);
		},
		
		/** Emails the password to the registered email. 410 status code if not found.
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return callback({Object}) Object representing user info
		 */
		sendPassword: function(loginid, callback, params, options){
			var qs = "user_action=emailUserPassword&email=" + encodeURIComponent(loginid);
			if(params){
				qs += "&"+ F.makeQueryString(params);
			}
			var defaults = {
				parameterParser: null,
				onError: function(errorMess, errorThrown, responseText){
					var response = $.parseJSON(responseText);
					callback(response);
				} //Call the login handler anyway with the status code
			};
			$.extend(defaults, options);
			var ac = new APIConnection(url, defaults.params, defaults);
				ac.post(qs , callback);
		}
	}
}());

/**  Archive API operations. 
 *  See http://sites.google.com/a/forio.com/documentation/api-documentation/api-archive for list of supported params
 *  @static
 *  @class Archive
 *  @namespace F.API
 */
F.API.Archive = (function(){
	var url = function(){return F.APIUtils.getURL("archive")};
	return{
		/** Remove a run from Archive. Same as setting the "Saved" property of the run to false through Run API
		 * @param {String|Array} runId runs to remove
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return {}
		 */
		remove:function(runId, callback, options, apioptions){
			var params =  {
				method: "DELETE",
				run: [].concat(runId)
			}
			
			var ac = new APIConnection(url, options, apioptions);
				ac.post(params , callback);
		},
		
		/** Get all archived runs. 
		 * @param {Mixed} filter Filter runs from the api (Optional)
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return {} 
		 */
		getRuns:function(filter , callback, options, apioptions){
			var ac = new APIConnection(url, options, apioptions);
				ac.getJSON(filter , callback);
		},
		
		/** Generic connection handler, does no params by default
		 * @param {String} key
		 * @param {*} params params to post
		 * @param {Function} callback 
		 * @param {*} options
		 */
		connect: function(params, callback, apioptions, connoptions){
			var ac = new APIConnection(url, apioptions, connoptions);
				ac.post(params, callback);
		},
		
		setProperties: function(runId, properties, callback, options, apioptions){
			var ac = new APIConnection(url, options, apioptions);
			properties = F.makeQueryString(properties, {seperator: ":"});
			var propQs= {
				"run_set" : properties.split("&"),
				"run": [].concat(runId)
			}
			
			ac.post(propQs, callback);
		}
	}
}());

/**  Simulation API operations. 
 *  See http://sites.google.com/a/forio.com/documentation/api-documentation/api-simulation for list of supported params
 *  @static
 *  @class Simulation
 *  @namespace F.Simulation
 */
F.API.Simulation = (function(){
	var url = F.APIUtils.getNonSimURL("simulation");
	return{

		/** Get simulations matching the filters specified. 
		 * @param {Mixed} filter Filter runs from the api (Optional)
		 * @param {Function} callback (optional)
		 * @param {Object} options (optional)
		 * @return {} 
		 */
		getSimulations:function(filter , callback, options){
			var ac = new APIConnection(url, options);
				ac.getJSON(filter , callback);
		}
	}
}());