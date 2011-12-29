/** All utility classes and functions related to establishing Ajax connections
 * @module Net
 * @author Naren
 */

/** Use for all ajax-y stuff within simulations. Among other benefits, it re-tries connections on failure, does param parsing etc.
 * @class AjaxConnection
 * @namespace
 * @constructor
 * @param {String} url url to connect to
 * @param {Object} settings Configuration options; see configs section below for values
 * @param {Object} ajaxOptions default jQuery ajax options
 * @return {}
 */
var AjaxConnection = function(url, settings, ajaxOptions){
	url || (url = "include/data/empty.txt"); //TODO: change to empty.txt on simulate later
	var FATAL_CODES = [404, 500, 403, 400, 409];
	var SUCCESS_CODES = [200, 201];
	var TIME_OUT = 401;
	
	var defaultSettings = {
		/** The no. of times to retry request before calling error handler
		 * @config tries
		 * @type Number
		 * @default 2
		 */
		tries : 2,
		/** If true, the call redirects to the login page on access denied errors; else it calls the error handlers
		 * @config allowRedirect
		 * @type Boolean
		 * @default false
		 */
		allowRedirect: false,
		/** Time between reconnection attempts
		 * @config reconnectInterval
		 * @type Number
		 * @default 2000
		 */
		reconnectInterval: 2000,
		/** Error handler. By default shows the error message in an alert, and logs to console if possible
		 * @config onError
		 * @type Function
		 */
		onError: function(errorMessage, errorThrown){
			var em =  "AjaxConnection: Status " + errorMessage.status + " : " +  errorMessage.message;
			if(errorThrown){
				if(errorThrown.name){ //Error object
					em +=  "  " +  errorThrown.name + ":" + errorThrown.message + " at " + url;
					
				}
				else{
					//em += errorThrown;
					if(window.console && window.console.log){
						window.console.log(errorThrown);
						em += " .Logged to console.";
					}
				}
			}
			alert(em);
		},
		/** Success handler. Called with response
		 * @config onSuccess
		 * @type Function
		 */
		onSuccess: $.noop,
		/** Request termination handler; called regardless of success or failure
		 * @config onComplete
		 * @type Function
		 */
		onComplete: $.noop,
		/** Run the query params through this function before posting it; use F.makeQueryString in most cases. TODO:// should i default to this?
		 * @config parameterParser
		 * @type Function
		 */
		parameterParser: function(param){
			return param;
		},
		/** Connection not made till this function returns true; Used to remove swfs off page for ie, and maybe for validation before posting
		 * @config preloadCondition
		 * @type Function
		 */
		preloadCondition: function(){
			return true;
		}
	}
	$.extend(defaultSettings, settings);
	if(!defaultSettings.allowRedirect) url += (url.indexOf("?") == -1) ? "?skip_redirect=true" : "&skip_redirect=true";
	
	//jQuery ajax settings
	var connSettings = {
		type: "POST",
		cache: false,
		dataType: "text",
		data: "",
		processData: false, 
		error: handleError,
		success: handleSuccess,
		url: url
	};
	$.extend(connSettings, ajaxOptions);
	
	function _error(XMLHttpRequestObj,  errorText, errorThrown){
		var status = parseInt(XMLHttpRequestObj.status);//simulate returns string, http returns int;
		var errorText = XMLHttpRequestObj.statusText;
		var responseText = XMLHttpRequestObj.responseText;
		
		
		var isFatalError  = (F.Array.contains(status, FATAL_CODES) || defaultSettings.tries <= 0);
		var isTimeOutError = (status === TIME_OUT);
		if(isTimeOutError || isFatalError){
			var errorMessage = {status: status, message: errorText};
			defaultSettings.onError(errorMessage, errorThrown);
			defaultSettings.onComplete(responseText);
		}
		else{
			//Unknown error
			defaultSettings.tries-- ;
			setTimeout(function(){ connect(connSettings)}, defaultSettings.reconnectInterval);
		}
	} 
	
	//Connection error
	function handleError(XMLHttpRequest, textStatus, errorThrown){ 
		_error( XMLHttpRequest, errorThrown)
	}
	//If you do skip_redirect, the request returns fine but has the status code in it. Check if that code has an error
	function handleSuccess(response){
		var callback  = function(response){
			defaultSettings.onSuccess(response);
			defaultSettings.onComplete(response);
		}
		
		try{//Check if response has error code in it 
			var data = (F.isObject(response)) ? response : $.parseJSON(response.responseText); //response may already be JSON parsed
			var status = (data) ? parseInt(data.status_code) : 0;
			
			if(!status || F.Array.contains(status, SUCCESS_CODES)){
			 	callback(response); //No known errors, pass it on
			}
			else{
				_error(status, data.message, data);
			}
		}
		catch(e){
		 	callback(response); //Not a json response, pass it on
		} 
	}
	 
	function connect(options, callback){
		if(callback === null) callback = undefined; //nulls don't play well with jquery extend
		$.extend(defaultSettings, {onSuccess : callback});
		$.extend(connSettings, options);
		
		connSettings.data = (defaultSettings.parameterParser) 
			? defaultSettings.parameterParser(connSettings.data)
			: connSettings.data;
		
		var preLoadFn = defaultSettings.preloadCondition;
		var timeBetweenTries = 500;
		
		var timer;
		if(preLoadFn() !== true){ //Default fn returns true;
			timer = setInterval (function(){
				if(preLoadFn() === true){
					clearInterval(timer);
					$.ajax(connSettings);
				}
			}, timeBetweenTries);
		}
		else{
			$.ajax(connSettings);
		}
	}
	return{
		/** Do a GET request
		 * @param {*} params parameters to pass through
		 * @callback {Function} Callback function (optional)
		 * @optional {Object} configuration options
		 */
		get: function(params, callback, options){
			var defaults = {
				type: "GET",
				data: params
			}
			$.extend(defaults, options);
			connect(defaults, callback);
		},
		/** GET but callback gets called with an object instead of a string
		 * @param {*} params parameters to pass through
		 * @callback {Function} Callback function (optional)
		 * @optional {Object} configuration options
		 */
		getJSON: function(params, callback, options){
			var defaults = {dataType: "json"};
			$.extend(defaults, options);
			this.get(params, callback, options);
		},
		/** GET but callback gets called with HTML. Use for navigation
		 * @param {*} params parameters to pass through
		 * @callback {Function} Callback function (optional)
		 * @optional {Object} configuration options
		 */
		getHTML: function(params, callback, options){
			var defaults = {
				dataType: "HTML",
				type: (params) ? 'POST' : 'GET',
				data: params
			}
			$.extend(defaults, options);
			connect(defaults, callback);
		},
		/** Ajax POST
		 * @param {*} params parameters to pass through
		 * @callback {Function} Callback function (optional)
		 * @optional {Object} configuration options
		 */
		post: function(params,  callback, options){
			var defaults = {
				type: "POST",
				data: params
			}
			$.extend(defaults, options);
			connect(defaults, callback);
		},
		/** Rudimentary connection; Use if u need to override gets or posts; use 'data' for params and other standard Jquery options
		 * @param {*} params parameters to pass through
		 * @callback {Function} Callback function (optional)
		 * @optional {Object} configuration options
		 */
		connect: function(options, callback){
			connect(options, callback);
		}
	}
}

/** Polls a specified url for a value
 * @class PollingConnection
 * @extends AjaxConnection
 * @constructor
 * @namespace
 * @param {String} url url to connect to; Assumed to be JSON
 * @param {*} conditionFlags List of conditions to check result against. Set this to blank and provide a onPulse fn for infinite polling.
 * @param {Object} options to AjaxConnection
 * @return {this}
 */
var PollingConnection = function(url, conditionFlags, options){
	var defaults ={
		/** Calls the callback function if ANY of the conditions match. Set to false to match ALL
		 * @config matchAny
		 * @type Boolean
		 * @default true
		 */
		matchAny : true,
		/** Success handler when conditions have been met
		 * @config onSuccess
		 * @type Function
		 */
		onSuccess: $.noop,
		/** Time between polling attempts in ms
		 * @config interval
		 * @type Number
		 * @default 18000
		 */
		interval: 18000,
		/** Params to pass to the file being polled.
		 * @config params
		 * @type *
		 */
		params: "",
		/** Function to execute every polling interval.
		 * @config onPulse
		 * @type Function
		 */
		onPulse: $.noop
	}
	$.extend(defaults, options)
	
	var jQOptions = {
		dataType: "json",
		type: (defaults.params) ? 'POST' : 'GET',
		data:  F.makeQueryString(defaults.params)
	}
	
	var timer;
	var successHandler = function(data){
		var conditionSatisfied;
		conditionFlags = F.makeObject(conditionFlags);
		
		for(var condition in conditionFlags){
			if(data[condition] === undefined || data[condition] != conditionFlags[condition]){ //Condition not satisfied
				conditionSatisfied = false;
				if(!defaults.matchAny){
					break; //We were supposed to match everything;
				}
			}
			else{ //Wee have a winnerrr
				conditionSatisfied = true;
				if(defaults.matchAny){
					break;
				}
			}
		}
		
		if(!conditionSatisfied){
			timer = setTimeout(function(){ac.connect()}, defaults.interval); //Poll condition not satisfied, try again
		}
		else{
			defaults.onSuccess(data);
			cancelTimer();
		}
		defaults.onPulse(data);
	}
	
	var cancelTimer = function(){
		if(timer) clearTimeout(timer);
	}
	var acOptions = {
		tries : 1,
		onSuccess: successHandler,
		parameterParser: null
	}
	var ac = new AjaxConnection(url, acOptions, jQOptions);
	
	return{
		/** Start polling
		 */
		init: function(){
			ac.connect();
		},
		/** Stop polling
		 */
		cancel: function(){
			cancelTimer();
		}
	}
}


//Under construction
F.QS = {
	hasParam: function(qs, param){
    	return (!!this.getParamValue(qs, param));
    },
    getParamValue: function(qs, param){
    	var objQs = F.makeObject(qs);
    	return object[param];
    },
    setParamValue: function(qs, param, value){
    	
    },
    combine: function(){
    	var src = arguments[0];
    }
}
