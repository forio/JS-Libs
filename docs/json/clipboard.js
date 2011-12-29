/** UI widgets being used across simulations
 * @author Naren
 * @module Widgets
 */

/** Provides a copy to clipboard flash button. If using on multiple places in a page, init once and clone many times
 * @class ClipBoard
 * @namespace
 * @static
 * @example
 *      var cc = ClipBoard.init('domId');
 *          cc.render("fnToBeCalledOnClick", "domIdIfYouWantToCloneIt");
 *		or just ClipBoard.init("domId", settings);
 */
var ClipBoard = function(){
	return{
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
	    	/** Text to be displayed in the Button
		     * @config text
		     * @type  String
		     * @default 'Copy to Clipboard'
		     */
	        text: "Copy To Clipboard",
	        /** Function the SWF calls to get data; Override if you want copy fancy formatted data etc
		     * @config datasource
		     * @type  String
		     * @default ClipBoard.copyTable('.dataTable')
		     */ 
	        datasource: "ClipBoard.copyTable('.dataTable')",
			/** Path to icon for copy image
			 * @config icon
			 * @type String
		     * @default "../img/page_white_paste.png"
			 */
	        icon: "../img/page_white_paste.png",
	        /** Success handler on successful copy; Displays an alert/Dialog by default
	    	 * @config onSuccess
	    	 * @type String
	    	 * @default  "ClipBoard.copySuccess"
	         */
	        onSuccess: "ClipBoard.copySuccess",
			/** Failure handler on failed copy; Displays an alert/Dialog by default
			 * @config onFailure
			 * @type String
			 * @default  "ClipBoard.copyFailure"
			 */
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
	    
	    /** Initialization fn. Use Clipboard.swf?debug=true to print debug info to trace/console
	     * @param domId {String}  - Elem where swf should be placed. 
	     * @param settings {Object} (Optional)  See config attributes
	     * @param dimensions {Object} (Optional) Dom dimenstions of the form {width: x; height: x}
	     */
	    init: function(domId, settings, dimensions){
			if($("#" + domId).size() == 0) return;
			
	        this.id = domId;
	        $.extend(this._defaultDimensions, dimensions);
	        var flashVars = $.extend({}, this._defaultSettings,settings );
	        swfobject.embedSWF("swf/ClipBoard.swf", domId, this._defaultDimensions.width, this._defaultDimensions.height,
	                        '9.0.0','swf/expressInstall.swf', flashVars, this. _params);
	    },
	    
	    /** Specified as default datasource for Flash copy function
	     * @private
	     * @param {String} tableSelector jQuerySyntax
	     * @return {String} tab/newline delimited data
	     */
	    copyTable: function(tableSelector){
			tableSelector || (tableSelector = 'table.dataTable');
			var tableData = [];
			var getCellContents = function(cell){
				var textElems = $(cell).children(':text').get();
				var val = "";
				if(!!textElems.length){
					val = $.trim($(cell).children(':text').val());
				}
				else{
					val = $.trim($(cell).text());
				}	
				return val;
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
	    /** Initializes a second instance of the button
	     * @param domId {String} (Optional)  - Use if you want to render the chart to a diff place than init.
	     * @param settings {Object} (Optional) - See config
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
	    /** Called by Flash when the swf is loaded. Needed 'coz onDOMReady doesn't play well with swfs
	     * @private
	     */
	    onInit: function(){
	        //console.log("initied", this.mostRecentElementAttached, this.mostRecentConfig)
	        if(this.mostRecentElementAttached){
	            $('#' + this.mostRecentElementAttached).get(0).render(this.mostRecentConfig); // Flash render fn
	            this.mostRecentElementAttached = "";
	            this.mostRecentConfig = null;
	        }
	    },
	    /** Default success handler. Called by Flash. Can be overriden through additional param to 'render'
	     * @private
	     */
	    copySuccess: function(){
	        var sucText = "Data copied to clipboard.";
	        ClipBoard._alert(sucText);
	    },
	    /** Default failure handler. Called by Flash. Can be overriden through additional param to 'render'
	     * @private
	     */
	    copyFailure: function(err){
	        var failText = "Error copying data: " + err;
	        ClipBoard._alert(failText);
	    }
	}
}();