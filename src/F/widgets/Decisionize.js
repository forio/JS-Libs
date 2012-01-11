//Jquery selector to return everything which has a model property set
$.expr[':'].dataModel = function(obj){
  var $this = $(obj);
  return (!!$this.data('model'));
};

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
				val = val.replace(/D_/i, "")
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
				//console.log("listenersForThisVal", listenersForThisVal, value);
				
				var formattedVal = (value.decisionFormatted) ? value.decisionFormatted : value.resultFormatted;
				var actualVal = (value.decision) ? value.decision : value.result;
				
				var isChanged = function(elem, valsObj){
					var nodename = elem.nodeName.toLowerCase();
					var type = (elem.type) ? elem.type.toLowerCase() : "";
					
					var val = (valsObj.decision) ? valsObj.decision: valsObj.result;
						val = parseFloat(val);
						
					var formattedVal = (valsObj.decisionFormatted) ? valsObj.decisionFormatted: valsObj.resultFormatted;
					
					var isChange;
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
					//console.log("checking", elem, isChange)
					return isChange;
				}
				$.each(listenersForThisVal, function(index, listener){
					if(isChanged(listener, value)){
						$(listener).trigger("modelChange", {value: value, run:run, animate: animate});
					}
				});
			});
		});
	}
	
	
	//Saving related
	var save = function(elem){
		var key = $(elem).data("model") ? $(elem).data("model") : $(elem).attr("name");
		if(key.toLowerCase().indexOf("d_") == 0){
			//Save in Run API
			F.API.Run.saveValues(elem, populate);
		}
		else{
			//Save in Data API
			F.API.Data.save(elem, populate);
		}
	}
	
	var uiChangeHandler = {
		radio: function(){
			if(this.checked)
				save(this);
		},
		checkbox: function(){
			if(this.checked)
				save(this)
			else{
				var key = $(this).data("model") ? $(this).data("model") : $(this).attr("name");
				var val = $(this).data("off") ? $(this).data("off") : 0;
				save(key + "=" + val);
			}
		},
		input: function(){
			save(this);
		},
		textFocus: function(){
			$(this).data("valid", $(this).val());
		},
		text:  function(){
			var $elem = $(this);
			
			var min = $elem.attr("min") || $elem.data("min");
			var max = $elem.attr("max") || $elem.data("max");
			
			var val = F.Number.extract($elem.val());
			if((min && val < min) || (max && val > max)){
				var prevData = $elem.data("valid");
				$elem.val(prevData);
			}
			else{
				$elem.data("valid", $elem.val());
				save(this);
			}
		}
	}
	
	var modelChangeHandler = function(){
			var getVal = function(valsObj){
				val = (valsObj.decision) ? valsObj.decision: valsObj.result;
				return parseFloat(val);
			}
			var getFormattedVal = function(valsObj){
				return (valsObj.decisionFormatted) ? valsObj.decisionFormatted: valsObj.resultFormatted;
			}
		return{
			radio: function(event, params){
				this.checked = !this.checked;
			},
			text: function(event, params){
				$(this).val(getFormattedVal(params.value));
			},
			base: function(event, params){
				$(this).text(getFormattedVal(params.value));
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
					.on("click.d", ":radio:dataModel", uiChangeHandler.radio)
					
					.on("blur.d", "textarea:dataModel", uiChangeHandler.input)
					.on("change.d", ":checkbox:dataModel", uiChangeHandler.checkbox)
					.on("change.d", "select:dataModel", uiChangeHandler.input)
					.on("change.d", "input[type='range']:dataModel", uiChangeHandler.input)
					
					.on("focus.d", ":text:dataModel,input[type='number']:dataModel", uiChangeHandler.textFocus)
					.on("change", ":text:dataModel, input[type='number']:dataModel", uiChangeHandler.text)
					
					.on("modelChange.default", ":radio:dataModel,:checkbox:dataModel", modelChangeHandler.radio)
					.on("modelChange.default", "textarea:dataModel, :text:dataModel, select:dataModel, input[type='number']:dataModel", modelChangeHandler.text)
					.on("modelChange.default", ":dataModel:not(input,select,textarea)", modelChangeHandler.base)
					.on("modelChange.default", ":dataModel", function(event, params){
						var me = this;
						if(params.animate){
							$(me).addClass("changed");
								setTimeout(function(){$(me).removeClass("changed")}, 1500) 
						}
						
					})
			})
		}
	}
}())