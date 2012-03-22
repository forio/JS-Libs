/**
 *  Utility functions
 *  @module Utils
 */
 
/**
 *  @class 
 *  @static
 *  @namespace F
 */  
var F = function(){
	//Utility fn used by type checkers
	function is(args, type, testFn){
		testFn || (testFn = function(o){return  typeof o === type;})
		var isValid = true;
		for(var i=0; i < args.length; i++){
			if(testFn(args[i]) !== true){
				isValid = false;
				break;
			}
		}
		return isValid;
	}
	
	/* @param {HTMLElement| String} Decision element or "name = value" string
	 * @param {String} suffix to attach to the decision name; e.g. "initial value" gets the reset val
	 * @return {String} Obj.quanitfiedDName = value;
	 */ 
	function _quantifyParamName(param, options){
		if(!param || F.isEmpty(param)) return "";
		var settings = {
			prefix: "",
			suffix: "",
			mappingFn: null
		}
		$.extend(settings, options);
		
		var pName = ""; 
		if(F.isElement(param)){
			//You can specify name either with the 'name' field or the model field;
			
			pName = $(param).data("model") ? $(param).data("model") : param.name;
			if(!pName) throw new Error("Error parsing decision name: Element does not have 'name' property.")
		}
		else if(F.isObject(param)){
			for(var prop in param){ 
				//Assume object has only 1 property. If it has more ignore and just take the longest one. Should i throw an error?
				pName = prop; 
			}
		}
		else if(F.isString(param) && param.indexOf(settings.seperator) !== -1){
			pName = param.split(settings.seperator)[0];
		}
		else{
			pName = param;
		}
		
		if(settings.mappingFn){
			pName = settings.mappingFn(pName);
		}
		
		//Add prefix if it's not already there
		if(pName.substring(0, settings.prefix.length) !== settings.prefix){
			pName = settings.prefix + pName;
		}
		
		pName = F.Template.compile(pName);
		return pName;
	}
	
	function _getParamValue(param, options){
		var pVal = "";
		if(F.isElement(param)){
			//Do slightly more intelligent parsing for checkboxes and radio-buttons
			if(param.nodeName.toLowerCase() === "input"){
				var type= param.type.toLowerCase();
				switch(type){
					case "checkbox":
						if(param.checked){
							pVal = $(param).val();
						}
						else{
							pVal = ($(param).data("off") ? $(param).data("off"): 0);
						}
						break;
					case "radio":
						if(param.checked){
							pVal = $(param).val();
						}
						
						else{
							pVal = 0;
							//Why would you save an unchecked radio button? Should I warn?
							if(console && console.warn) 
								console.warn(param, "is an unchecked radio button. Saving value as 0");
						}
						break;
					default:
						pVal = $(param).val(); 
				}
			}
			else{
				//selects and whatnot
				pVal = $(param).val(); 
			}
			
			
			if(pVal === undefined) throw new Error("Error parsing decision value: Element does not have 'value' property.");
		}
		else if(F.isObject(param)){
			for(var prop in param){
				pVal = param[prop]; 
			}
		}
		else if(F.isString(param)){
			if(param.indexOf(options.seperator) === -1)
				throw new Error("Error parsing decision value: String should be in 'name=value' format");
			pVal = param.split(options.seperator)[1];
		}
		else{
			throw new Error("Unknown Input Format"); 
		}
		return $.trim(pVal);
	}
	
	/* @param paramList {*}
	 * @param type {String} 'string' or 'object'
	 */
	function make(paramList, type, options){
  	 	if(!paramList || F.isEmpty(paramList)) return "";
  	 	var defaults ={
  	 		seperator : "=",
  	 		encode: true
  	 	}
  	 	$.extend(defaults, options);
  	 	
		if(!F.isArray(paramList)){
			if(F.isElement(paramList, "form")){
				paramList = $(paramList).serialize().split("&");
			}
			else if(F.isElement(paramList)){
				paramList = [].concat(paramList);
			}
			else if(F.isObject(paramList)){
				paramList = F.Object.toArray(paramList, defaults);
			}
			else if(F.isString(paramList)){
				if(defaults.encode !== false)
					paramList = paramList.split('&');
				else
					paramList = [paramList];
			}
			else{
				throw new Error("make: cannot identify input type");
			}
		}
		else{
			//Copy array or the recursion destroys it. Interesting
			paramList = paramList.slice();
		}
		
		var makeParam = function(decision){
			var pName = _quantifyParamName(decision, defaults);
			var pVal =  _getParamValue(decision, defaults);
			
			var param;
			if(type === "string") {
				var tempParam = (defaults.encode) ? [encodeURIComponent(pName), encodeURIComponent(pVal)] : [pName, pVal];
				param= tempParam.join(defaults.seperator);
			}
			else{
				param = {}; 
				param[pName] = pVal;
			}
			return param;
		}
		var combineParams = function(arg1, arg2){
			var val = (type === "object") ? $.extend(arg1, arg2) : arg1 + "&" + arg2 ; //TODO: Replace extend by combine Qs later
			return val;
		}
		
		var isRecursionEnd = function(data){
			if(F.isObject(data)){
				var countOfItems = 0;
				for (var name in data) {
					if(data.hasOwnProperty(name)) countOfItems++
					if(countOfItems > 1) return false
				}
			}
			else if(F.isString(data)){
				return data.split("&").length == 1;
			}
			else{
				return true;
			}
			
		}
		
		var qs;
		if(paramList.length === 1 && isRecursionEnd(paramList[0])){
			qs = makeParam(paramList[0]);
		}
		else{
			var top = paramList.pop();
			qs =  combineParams(make(paramList,type, options), make(top,type, options)); //recursion w00t
		}
		return qs;
	}
	return{
		/** Check if inputs are strings; fails if any of the params aren't
		 * @param {String} Pass in as many inputs you want to check
		 * @return {Boolean}
		 */
		isString: function(){
			return is(arguments, "string");
		},
		
		/** Check if inputs are numbers; fails if any of the params aren't
		 * @param {String} Pass in as many inputs you want to check
		 * @return {Boolean}
		 */
		isNumber: function(){
			return is(arguments, "number");
		},
		
		/** Check if inputs are arrays; fails if any of the params aren't
		 * @uses $.isArray
		 * @param {String} Pass in as many inputs you want to check
		 * @return {Boolean}
		 */
		isArray: function(){
			return is(arguments, "", $.isArray);
		},
		
		/** Check if inputs are strings; fails if any of the params aren't
		 * Does NOT return true for objects created with new keyword or anything but obj literals
		 * @uses $.isPlainObject
		 * @param {String} Pass in as many inputs you want to check
		 * @return {Boolean}
		 */
		isObject: function(){
			return is(arguments, "",  $.isPlainObject);
		},
		
		/** Check if inputs is HTMLElement
		 * @param {*} o Item to check
		 * @param {String} type pass in type to add an additional level of constraint checking; defaults to 'any'
		 * @return {Boolean}
		 */
		isElement: function(o, type){
			var isValid = false;
			if(o && o.nodeName && (!type || o.nodeName.toLowerCase() === type.toLowerCase())){
				isValid = true;
			}
			return isValid;
		},
		
		/** Check if inputs is 'emtpy', as opposed to undefined; i.e blank strings, empty objects, 0 elem arrays
		 * @param {*} 0 input to check
		 * @return {Boolean}
		 */
		isEmpty: function(o){
			return (o === "" || (F.isObject(o) && $.isEmptyObject(o)) || (o.length !== undefined && o.length === 0));
		},
		
		 /** Converts anything to an object literal
		 * @param {String||HTMLElement||Object||Array} paramList input to convert
		 * @param {Object} options @see makeQueryString
		 * @return {Object}
		 */
		makeObject: function(paramList, options){ 
			if(F.isObject(paramList)){
				return paramList;
			}
	    	return make(paramList, "object", options);
	    },
	    
	    /** Converts anything to a url-ready string
	     * @param {String||HTMLElement||Object||Array||Mixed} paramList input to convert
	     * @param {Object} options 
	     * @config {String} prefix D_ or something to append to every item in the list. Doesnt add if already there
		 * @config {String} suffix If string has [, inserts it before that.
		 * @config {String} seperator  character between parameter name and value; defaults to "=", but u can use ":" instead
		 * @config {Boolean} encode specify if you want to urlEncode the parameter and the value (NOT the whole string). Defaults to yes
		 * @return {String} querystring
		 */
	    makeQueryString: function(paramList, options){
			return make(paramList, "string", options);
	    },
	    stringify: function(data){
	    	if(!JSON && YAHOO && YAHOO.lang){
				JSON = YAHOO.lang.JSON
			}
			if(!JSON){
				throw new TypeError("JSON is undefined. Include json.js");
			}
			return JSON.stringify(data);
	    }
	}
}()

/** Template to include across all queries across the APIs
 * @static
 * @class Template
 * @namespace F
 */
F.Template = (function(){
	var template = {};
	return{
		/** Set the template mapping function
		 * @param {Object} templ  Mapping function - use as {stuffToReplace: replacement} even {stuffToReplace: function(){return replacement}()}
		 */
		set: function(templ){
			template = templ;
		},
		
		get: function(){
			 return template;
		},
		
		/** Replaces string with mapped template
		 * @param {String} str  string to operate upon
		 * @param {Object} templ If you're compiling with a different template from the default
		 */
		compile: function(str, templ){
			templ || (templ = template);
			
			for(var m in template){
				if(!m) continue;
				
				var replacement = ($.isFunction(template[m]) ? template[m]() : template[m]);
				var r = new RegExp("<" + m + ">", "ig");
				str = str.replace(r, replacement);
			}
			
			return str;
		}
	}
}())

F.Number = {
	extract: function(input, options){
		var defaultOptions = {
			skipSuffix: false
		}
		$.extend(defaultOptions, options);
		
		input  = input.replace(/,/g, "");
		var floatMatcher = /([-+]?[0-9]*\.?[0-9]+)(K?M?B?)/i;
		var results = floatMatcher.exec(input + "");
		var number, suffix = "";
		if(results && results[1]){
			number = results[1]
		}
		if(results && results[2]){
			suffix = results[2].toLowerCase();
		}
		
		if(!defaultOptions.skipSuffix){
			switch(suffix){
				case "k":
					number = number * 1000;
					break;
				case "m":
					number = number * 1000000;
					break;
				case "b":
					number = number * 1000000000;
					break;
				default:
					number;
			}
		}
		
		return parseFloat(number);
	},
	
	getRandomSeed: function(from, to, isInteger){
        if(from === undefined) from = 0;
        if(to === undefined) to = 1000000000;
		var rnd =  Math.random() * (to - from + 1) + from;
		if(isInteger) rnd= Math.floor(rnd);
		return rnd;
	}
}
/** Stringy functions
 *  @static
 *  @class String
 *  @namespace F
 */
F.String = {
	/** Compares strings (or numbers) regardless of case
	 * @param {String} str1 
	 * @param {String} str2 the strings to check
	 * @return {Boolean} flag set to true if they're equal
	 */
	equalsIgnoreCase: function(str1, str2){
		if(str1 === undefined || str2 === undefined){
			throw new TypeError("F.String.equalsIgnoreCase: Inputs are undefined");
		}
		 str1 = $.trim((str1 + "").toLowerCase());
  		 str2 = $.trim((str2 + "").toLowerCase());
  		 return str1 === str2;
	},
	
	/** Strips tabs, carriage returns and empty lines from a string.
	 * @param {String} ipString The string to clean
	 * @return {String} the 'clean' string
	 */
	clean: function(ipString){
		if(!F.isString(ipString)){
			throw new TypeError("String.clean: " + ipString + " is not a String.");
		}
	    return $.trim(ipString.replace(/\/t/g, "").replace(/\r/g, "")).split("\n").join("");
	},
	
	/** Tests a string for blank/ maxLength. Useful for input validations. 
	 * @param {String} ipString the string to validate
	 * @param {Object} settings 
	 * @return {Boolean} true if string is valid
	 */
	isValid: function(ipstring, settings){
	    if(!F.isString(ipstring)){
	        throw new TypeError("String.isValid: input is not a String.");
	    }
	    var defaults = {
	        allowNull: false,
	        maxLength: 200,
	        pattern: false
	    }
	    $.extend(defaults, settings);
	    var isValid = true;
	    
	    if(defaults.allowNull === false && (!ipstring || $.trim(ipstring) === "")){
	        isValid = false;
	    }
	    
	    if(ipstring.length > defaults.maxLength){
	       isValid = false;
	    }
	    
	    if(defaults.pattern){
	    	var regexPattern = new RegExp(defaults.pattern);
	    	if(!regexPattern.test(ipstring)){
                isValid = false;
            }
	    }
	    return isValid;
	},
	
	/** Checks if string is a valid email address
	 * @extends isValid
	 * @param {String} ipString
	 * @param {Object} settings @see isValid for options
	 * @return {Boolean} true if email is valid
	 * 
	 */
	isValidEmail: function(ipString, settings){
		var emailRegex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		var defaults  = $.extend(settings, {pattern: emailRegex});
		return this.isValid(ipString, defaults);
	}
}

/** XML utility functions
 *  @static
 *  @class XML
 *  @namespace F
 */
F.XML = {
	/** Converts XML/ Dom list to string
	 * @param {XML} node
	 * @return {String}
	 */
	toString: function(node) {
		if (typeof XMLSerializer != "undefined") { //Ffox
			return (new XMLSerializer()).serializeToString(node);
		} else if (node.xml) {
			return node.xml;
		} else {
			return "";
		}
	}
}

/** Array utility functions
 *  @static
 *  @class Array
 *  @namespace F
 */
F.Array = {
	/** Max of elements in array
	 * @param {Array} ipArray input array
	 * @return {Number} max element in array
	 */
	max: function(ipArray){
		if(!F.isArray(ipArray)){
			throw new TypeError("Array.max: input is not an array.");
		}
	    var max = parseFloat(ipArray[0]);
	    if(!max){
	    	throw new Error(max + "is not a number");
	    }
	    var currentItem;
	    for (var i = 0; i < ipArray.length; i++) {
	        var currentItem = parseFloat(ipArray[i]);
	        if (max < currentItem)      max = currentItem;
	    }
	    return max;
	},
	
	/** Min of elements in array
	 * @param {Array} ipArray input array
	 * @return {Number} min element in array
	 */
	min: function(ipArray){
		if(!F.isArray(ipArray)){
			throw new TypeError("Array.min: input is not an array.");
		}
	    var min =  parseFloat(ipArray[0]);
	    var currentItem;
	    for (var i = 0; i < ipArray.length; i++) {
	        currentItem =  parseFloat(ipArray[i]);
	        if (min > currentItem) min = currentItem;
	    }
	    return min;
	},
	
	/** Checks if item is in array
	 * @param {value} value to search for
	 * @param {Array} ipArray input array
	 * @return {Boolean} true if found
	 */
	contains: function(value, ipArray ){
		if(!F.isArray(ipArray)){
			throw new TypeError("Array.contains: input is not an array.");
		}
	    var found = false;
	    for(var i=0;  i< ipArray.length; i++){
	        if($.trim(value) === $.trim(ipArray[i])){
	            found = true;
	            break;
	        }
	    }
	    return found;
	},
	/** Non-destructive array copy
	 * @param {Array} ipArray
	 * @return {Array} copy of input
	 */
	copy: function(ipArray){
		if(!F.isArray(ipArray)){
			throw new TypeError("Array.copy: input is not an array.");
		}
		return $.extend(true, [], ipArray);
		//return ipArray.slice();
	},
	areEqual: function(array1, array2){
		if(array1.length != array2.length){
			return false;
		}
		for(var i=0; i< array1.length; i++){
			if(array1[i] !== array2[i]){
				return false;
			}
		}
		return true;
	}
}

/** Object utility functions
 *  @static
 *  @class Object
 *  @namespace F
 */
F.Object = {
	toArray: function(obj, options){
		var defaults = {
			seperator: "="
		}
		$.extend(defaults, options)
		
		if(!F.isObject(obj)){
			throw new TypeError("Object.toArray: input is not an Object.");
		}
	 	var qs = [];
	    for(var prop in obj){
	    	if(F.isArray(obj[prop])){
	    		var paramArray = obj[prop];
	    		for(var param in paramArray){
	    			qs.push(prop + defaults.seperator + paramArray[param] )
	    		}
	    	}
	    	else{
	            qs.push(prop + defaults.seperator + obj[prop]);
	    	}
	    }
	    return qs;
	},
	toQueryString: function(obj){
		if(!F.isObject(obj)){
			throw new TypeError("Object.toQueryString: input is not an Object.");
		}
		return this.toArray(obj).join("&");
	},
	
	/** Returns a stringified repn of the object
	 * @requires YAHOO.lang.JSON
	 * @param {Object| obj input object
	 * @return{String} string repn of the object;
	 */
	serialize: F.stringify
}



/** Networking utilities
 * @class Net
 * @static
 * @namespace F 
 */
F.Net ={
	/** Combines two query strings;
	 * @param {*} oldQs
	 * @param {*} newQs
	 * @param {Boolean} overwrite If true, combining a=b and a=c will return a=b&a=c; else will return a=c
	 * @return {String} combined querystring
	 */
    combineQueryStrings: function(oldQs, newQs, overwrite){
        var oldObj = F.makeObject(oldQs);
        var newObj = F.makeObject(newQs);
        if(overwrite){
            oldObj = $.extend(oldObj, newObj);
        }
        else{
            for(var param in newObj){
                if(oldObj[param] && oldObj[param] !== newObj[param]){
                    var oldVal = [].concat(oldObj[param]);
                    var newVal = [].concat(newObj[param]);
                    oldObj[param] = oldVal.concat(newVal);
                }
                else{
                    oldObj[param] =  newObj[param];
                }
            }
        }
        return F.makeQueryString(oldObj);
    },
  
    /** Changes the window location to the url
     * @param {String} url
     */
    goToURL: function(url){
        window.location.href = url;
    }
};
