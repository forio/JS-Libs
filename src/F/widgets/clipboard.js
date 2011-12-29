
/** Provides a copy to clipboard flash button.
 *  SWF is just loaded once and can be cloned through render for further usages.
 *  Example Usage: 
 *      var cc = ClipBoard.init('domId');
 *          cc.render("fnToBeCalledOnClick", "domIdIfYouWantToCloneIt");
 *  or just ClipBoard.init("domId", settings);
 */

var ClipBoard = {
    _params: {
        scale: 'noscale',
        salign: 'lt',
        wmode: 'transparent',
        allowScriptAccess: "always"
    }, 
    _defaultDimensions: {
        width: '175',
        height: '30'
    },
    
    _defaultSettings: {
        onInit: "ClipBoard.onInit",
        text: "Copy To Clipboard",
        datasource: "ClipBoard.copyTable('.dataTable')",
        icon: "../img/page_white_paste.png",
        onSuccess: "ClipBoard.copySuccess",
        onFailure: "ClipBoard.copyFailure"
    },
    id: "",
    mostRecentElementAttached: "",
    mostRecentConfig: null,
    
    _alert: function(text){
        try{
             Dialogs.showAlert(text) 
        }
        catch(e){
            alert(text);
        }
    },
    
    /* Initialization fn. Suggest creating the swf in a hidden obj and cloning it for future uses.
     * 
     * @param domId {String}  - Elem where swf should be placed. 
     * @param settings {Object} (Optional) 
     * @param dimensions {Object} (Optional)
     * @config dimensions.width {Number}  - Height of flash obj in px
     * @config dimensions.height {Number} - in px
     * 
     * Use Clipboard.swf?debug=true to print debug info to trace/console
     */
    init: function(domId, settings, dimensions){
		if($("#" + domId).size() == 0) return;
		
        this.id = domId;
        $.extend(this._defaultDimensions, dimensions);
        var flashVars = $.extend({}, this._defaultSettings,settings );
        swfobject.embedSWF("swf/ClipBoard.swf", domId, this._defaultDimensions.width, this._defaultDimensions.height,
                        '9.0.0','swf/expressInstall.swf', flashVars, this. _params);
    },
    copyTable: function(tableSelector){
		tableSelector || (tableSelector = 'table.dataTable');
		var tableData = [];
		var getCellContents = function(cell){
			var textElems = $(cell).find(':text').get();
			var val = "";
			
			if(!!textElems.length){
				val = $.trim($(cell).find(':text').val());
			}
			else if(!!$(cell).find('img').get().length){
				val = $.trim($(cell).find('img:first').attr('alt'));
			}
			else{
				val = $.trim($(cell).text());
			}	
			
			var strippedVal = val.replace("$",""); //Excel doesn't like leading char being a symbol
			var invalidChars = ["+", "-", "="];
			if(!parseFloat(strippedVal) && F.Array.contains(strippedVal.charAt(0), invalidChars)){
				val = "'" + val;
 			}
 			
 			//check for colspans
 			if($(cell).attr("colspan")){
 				var colspan = parseInt($(cell).attr("colspan"));
 				for(var i=1; i< colspan; i++){
 					val += "\t";
 				}
 			}
			return val;
		}
		
		if($(tableSelector + " caption").size() > 0){
			tableData.push($.trim($(tableSelector + " caption").text()));
		}
		var rowspanData = [];
		$(tableSelector + " tr").each(function(index, row){
			var rowspan =  $(this).children('td[rowspan]:eq(1)').attr("rowspan");
			if(rowspan && rowspan > 1){
				rowspan = parseInt(rowspan) - 1;
				for(var i=0; i< rowspan; i++){
					var thisRow = [];
					$(this).children('td, th').each(function(index, cell){
						thisRow.push(getCellContents(this));
					});
					rowspanData.push(thisRow);
				}
			}
			else{
				var thisRow = [];
				$(this).children('td, th').each(function(index, cell){
						thisRow.push(getCellContents(this));
				});
				if(rowspanData.length > 0){
					var rowSpanForthisCell = rowspanData.pop();
					thisRow = rowSpanForthisCell.concat(thisRow);
				}
				tableData.push(thisRow.join("\t"));
			}
		});
		return tableData.join("\n");
	},
    /*
     * @param datasource {String}  - Fn to be called onbuttonclick. Note, cant be an anonymous fn.
     * @param domId {String} (Optional)  - Use if you want to render the chart to a diff place than init.
     * @param setting {Object} (Optional) 
     * @config settings.text {String} 
     * @config settings.icon {String} 
     * @config settings.onSuccess {String} 
     * @config settings.onFailure {String} 
     */
    clone: function(domId, settings){
        var config = $.extend({}, this._defaultSettings,  settings);
        if(!config.datasource){
            ClipBoard._alert("Error: No Datasource defined to copy from.");
            return;
        }

        if(domId){ // We're cloning
            //var newFlashObj = $('#'+this.id).clone(); Makes ie blow up :)
            var newNode = $('#'+this.id).get(0).cloneNode(true);
                newNode.id = domId;
            $('#' + domId).replaceWith(newNode);
            this.mostRecentElementAttached = domId;
            this.mostRecentConfig = config;
        }
        else{
            this.mostRecentElementAttached = this.id;
            this.mostRecentConfig = config;
        }
    },
    /*
     * Called by Flash when the swf is loaded. Needed 'coz onDOMReady doesn't play well with swfs
     */
    onInit: function(){
        //console.log("initied", this.mostRecentElementAttached, this.mostRecentConfig)
        if(this.mostRecentElementAttached){
            $('#' + this.mostRecentElementAttached).get(0).render(this.mostRecentConfig); // Flash render fn
            this.mostRecentElementAttached = "";
            this.mostRecentConfig = null;
        }
    },
    /*
     * Default success handler; can be overriden through additional param to 'render'
     */
    copySuccess: function(){
        var sucText = "Data copied to clipboard.";
        ClipBoard._alert(sucText);
    },
    /*
     * Default failure handler; can be overriden through additional param to 'render'
     */
    copyFailure: function(err){
        var failText = "Error copying data: " + err;
        ClipBoard._alert(failText);
    }
}
