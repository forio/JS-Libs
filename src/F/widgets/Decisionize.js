//Jquery selector to return everything which has a model property set
$.expr[':'].dataModel = function(obj){
  var $this = $(obj);
  return (!!$this.data('model'));
};

/**
 *  You can have the same element listening to multiple model variables by seperating them using the "|" operator
 */
F.Decisionize = (function(){
	//Updating UI
	var populate = function(animate){
		if(animate !== false) animate = true;
		var queryList = [];
		
		// {decisionName: [elem1, elem2]}
		var valueElementList = {};
		
		//Get all displayed OP variables;
		$(":dataModel").each(function(){
			var modelVals = $(this).data("model").split("|");
			
			var elem = this;
			$.each(modelVals, function(index, val){
				val = val.replace(/D_/i, "");
				if(val.indexOf("=")!== -1) val = val.split("=")[0];
				
				var normalized = val.toLowerCase();
					
				if(!valueElementList[normalized]){
					valueElementList[normalized] = []
				} 
				valueElementList[normalized].push(elem);
				queryList.push(val);
			})
		});
		
		//Get Data from Run API
		F.API.Run.getValues(queryList, function(run){
			$.each(run.values, function(key, value){
				var listenersForThisVal = valueElementList[key];
				//console.log("listenersForThisVal", listenersForThisVal, key, value);
				
				var formattedVal = (value.decisionFormatted) ? value.decisionFormatted : value.resultFormatted;
				var actualVal = (value.decision) ? value.decision : value.result;
				
				var isChanged = function(elem, valsObj){
					var nodename = elem.nodeName.toLowerCase();
					var type = (elem.type) ? elem.type.toLowerCase() : "";
					
					var val = (valsObj.decision) ? valsObj.decision: valsObj.result;
						val = parseFloat(val);
						
					var formattedVal = (valsObj.decisionFormatted) ? valsObj.decisionFormatted: valsObj.resultFormatted;
					
					var action = $(elem).data("action") || "";
					var isUpdate = 
						(action.indexOf("update") !== -1 || action.indexOf("noop") === -1);
					
					var isShow =
						(action.indexOf("show") !== -1);
						
					var isChange = false;
					if(isUpdate){
						switch(nodename){
							case "input":
								var elemVal = $.trim($(elem).val());
								var elemValNo = parseFloat($(elem).val());
								switch(type){
									case "radio":
										isChange = (!elem.checked && val === elemValNo);
										break;
									case "checkbox":
										isChange = (elem.checked && val !== elemValNo) || (!elem.checked && val === elemValNo);
										break;
									default:
										isChange = (elemVal !== formattedVal);
								}
								break;
							case "select":
								var elemValNo = parseFloat($(elem).val());
								isChange = (elemValNo !== val);
								break;
							case "textarea":
								var elemVal = $.trim($(elem).val());
								isChange = (elemVal !== formattedVal);
								break;
							default:
								var elemVal = $.trim($(elem).text());
								isChange = (elemVal !== formattedVal);
						}
					}
					if(isShow){
						var elemName = $(elem).data("model").split("=")[0].toLowerCase();
						var elemVal = $(elem).data("model").split("=")[1];
						
						var isMatch = (parseFloat(elemVal) == val);
						var isHidden = ($(elem).hasClass("hidden"));
						
						isChange = (isMatch && isHidden) || (!isMatch && !isHidden);
						
						//console.log("change", elem, val, action, isMatch, isHidden, isChange)
					}
					
					//console.log("checking", elem, isChange)
					return isChange;
				}
				$.each(listenersForThisVal, function(index, listener){
					if(isChanged(listener, value)){
						$(listener).trigger("modelChange", {value: value, run:run, animate: animate});
						//console.log("Triggering model change:", listener, value.label, key);
					}
				});
			});
		});
	}
	
	
	var save = function(elem, oldvalue){
		var key = $(elem).data("model") ? $(elem).data("model") : $(elem).attr("name");
		if(key.toLowerCase().indexOf("d_") == 0){//Save in Run API
			F.API.Run.saveValues(elem, populate, null, {onError: function(error, actualError, responseText){
				responseText = $.parseJSON(responseText);
				if(responseText.errors){
					$.each(responseText.errors, function(index, error){
						var name = error.name.toLowerCase();
						if(error.decisionMax)  $(elem).attr("max", error.decisionMax);
						if(error.decisionMin)  $(elem).attr("min", error.decisionMin);
						
						$(elem).trigger("change.d", {oldvalue:oldvalue}); //Let the client-side validation kick in
					})
				}
			}});
		}
		else{
			//Save in Data API. TODO: I'm saving but not reading from it right now
			F.API.Data.save(elem, populate);
		}
	}
	
	//Handles on change events of UI elemts
	var uiChangeHandler = {
		base: function(){
			//MakeQueryString has logic for not saving a blank radio button, checkboxes etc, so just pass it through
			save(this);
		},
		textFocus: function(){
			$(this).data("valid", $(this).val());
		},
		text:  function(evt, data){
			var $elem = $(this);
			
			var min = $elem.attr("min") || $elem.data("min");
			var max = $elem.attr("max") || $elem.data("max");
			
			var val = F.Number.extract($elem.val());
			var prevData = (data && data.oldvalue)? data.oldvalue : $elem.data("valid");
			if((min && val <= min) || (max && val >= max)){
				var msg, type;
				$elem.val(prevData);
				
				if(min && val < min){
					msg = "Please enter a value greater than " + min;
					type = "min";
				}
				else{
					msg = "Please enter a value less than " + max;
					type = "max";
				}
				
				$elem.trigger("validationFailed",  {value: val, type: type, text: msg, min: min, max: max})
			}
			else{
				save(this, prevData);
				$elem.data("valid", $elem.val());
			}
		}
	}
	
	//Handles model updated events and updates ui elements
	var modelChangeHandler = function(){
			var getVal = function(valsObj){
				var val = (valsObj.decision) ? valsObj.decision: valsObj.result;
				return parseFloat(val);
			}
			var getFormattedVal = function(valsObj){
				return (valsObj.decisionFormatted) ? valsObj.decisionFormatted: valsObj.resultFormatted;
			}
			var matchVals = function(elem, valsObj){
				var actualVal = getVal(valsObj);
				var checkVal, valName;
				try{
					checkVal = parseFloat($(elem).data("model").split("=")[1]);
				}
				catch (e){
					throw new Error("To use show/hide the model should be in <modelname=value> format");
				}
				return (actualVal === checkVal);
			}
			
			var actionHandler = function(elem, type, params){
				var actions = ($(elem).data("action")) || "";
					actions = actions.split(",");
				
				if(!F.Array.contains("noop", actions)){
					actions.push("update");
				}
				//console.log("Actions found", actions, elem);
				//console.log("Triggered", elem, type, params.value.label, actions);
				//TODO: Make this configureable
				var CHANGE_CLASS = "changed";
				var HIDDEN_CLASS = "hidden";
				
				var defaultActionList = {
					update: function(params){
						switch(type){
							case "radio":
							case "checkbox":
								elem.checked = !elem.checked;
								break;
							case "text":
								$(elem).val(getFormattedVal(params.value));
								break;
							default:
								$(elem).text(getFormattedVal(params.value));
						}
						if(params.animate){
							$(elem).addClass(CHANGE_CLASS);
							setTimeout(function(){$(elem).removeClass(CHANGE_CLASS)}, 1500) 
						}
					},
					show: function(params){
						var elemmodelName = $(elem).data("model").split("=")[0].toLowerCase();
						var modelName = params.value.label.toLowerCase();
						
						if(modelName === elemmodelName){
							if(matchVals(elem, params.value)){
							$(elem).removeClass(HIDDEN_CLASS);
							//console.log("removing", HIDDEN_CLASS, "from", elem, params)
						}
						else{
							//console.log("adding", HIDDEN_CLASS, "to", elem, params)
							$(elem).addClass(HIDDEN_CLASS);
						}
						}
						
					},
					noop: $.noop
				}
				$.each(actions, function(index, action){
					action = $.trim(action);
					if(action){
						if(defaultActionList[action]){
							defaultActionList[action](params);
						}
						else{
							throw new Error("No default action found for " + action);
						}
					}
					
				})
			}
		return{
			radio: function(event, params){
				actionHandler(this, "radio", params)
			},
			text: function(event, params){
				actionHandler(this, "text", params)
			},
			base: function(event, params){
				actionHandler(this, "base", params);
			}
		}
	}()
	return{
		/**
		 * Gets values from Run API and populates data for everything on the page with a defined model
		 */
		populateUI: populate,
		init: function(selector){
			$(function(){
				selector || (selector = "body");
				selector+= " ";
				
				$(selector)
					.on("click.d", ":radio:dataModel", uiChangeHandler.base)
					.on("blur.d", "textarea:dataModel", uiChangeHandler.base)
					.on("change.d", ":checkbox:dataModel", uiChangeHandler.base)
					.on("change.d", "select:dataModel", uiChangeHandler.base)
					.on("change.d", "input[type='range']:dataModel", uiChangeHandler.base)
					
					.on("focus.d", ":text:dataModel,input[type='number']:dataModel", uiChangeHandler.textFocus)
					.on("change.d", ":text:dataModel, input[type='number']:dataModel", uiChangeHandler.text)
					
					.on("modelChange.default", ":radio:dataModel,:checkbox:dataModel", modelChangeHandler.radio)
					.on("modelChange.default", "textarea:dataModel, :text:dataModel, select:dataModel, input[type='number']:dataModel", modelChangeHandler.text)
					.on("modelChange.default", ":dataModel:not(input,select,textarea)", modelChangeHandler.base)
			})
		}
	}
}())