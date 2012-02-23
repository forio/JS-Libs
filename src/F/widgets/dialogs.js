/**
 * @author Naren
 * @module Widgets
 */
 
 /** Handy popup as an alternative to ugly HTML alerts. Oh, and it also does callbacks.
 * @class Dialogs
 * @static 
 * @namespace
 * @extends YAHOO.widget.SimpleDialog
 */
var Dialogs = {
	/**
	 * @param {String} divId Location to initailze dialog. Saves time if the div is already in YUI form;
	 * 		<textarea>
	 * 			<div id="container">
	 * 				<div class="hd"> Your Header </div>
	 * 				<div class="bd"> Your Body </div>
	 * 				<div class="ft"> Foorter text </div>
	 * 			</div>
	 * 		</textarea>
	 * @param {String} backupDiv By default you get one popup per app; Older one closes if new one comes in;
	 * 	Give another "backup" id if you want two at a time
	 */
	init: function(divId, backupDiv){
		this.ElemId = divId;
		this.alertDialog = 
			new YAHOO.widget.SimpleDialog(divId, 
			 { width: "600px",
			   fixedcenter: true,
			   visible: false,
			   draggable: false,
			   zIndex: 19,
			   modal: false,
			   close: false,
			   icon: YAHOO.widget.SimpleDialog.ICON_INFO,
			   constraintoviewport: true
			 } );
		 this.alertDialog.render(); 
		
		if(backupDiv){
	 		this.backupDialog = 
				new YAHOO.widget.SimpleDialog(backupDiv, 
				 { width: "600px",
				   fixedcenter: false,
				   visible: false,
				   draggable: true,
				   zIndex: 19,
				   modal: false,
				   close: false,
				   icon: YAHOO.widget.SimpleDialog.ICON_INFO,
				   constraintoviewport: true
				 } );
			 this.backupDialog.render();
		}
	},
	/**
	 * @private
	 */
	_isDialogOpen: function(dialog){
		return dialog.cfg.getProperty('visible');
	},
	/**
	 * @private
	 */
	_executeFnAndHide: function(callBackFn){
    	var allowHide = true;
		if(callBackFn){
			var fnReturnVal = callBackFn();
			//If you want to disable the dialog autoclosing, make the fn return nothing. OR true.
			// Useful if you're doing validation on stuff in dialog.
			if(fnReturnVal != undefined && fnReturnVal !== true){ 
				allowHide = false;
			}
		}
		if(allowHide) this.hide();
	},
	/**
	 * @private
	 */
	_applyConfigAndShow: function(cfg){
		var dialog = this.alertDialog;
		if(this._isDialogOpen(dialog) && this.backupDialog && cfg.singleton !== true){
			dialog = this.backupDialog;
		}
		 
		dialog.cfg.applyConfig(cfg);
		dialog.cfg.fireQueue();
		dialog.setHeader(cfg.header);
		dialog.show();
	},
	/**
	 * Displays the popup box
	 * @param {String|HTML} text stuff to display in the popup
	 * @param {Function} callBackFn Executed on dialog close by default; Closes the popup if this returns undefined OR true. 
	 * 					 Doesn't close for other values. Useful to do validation stuff, especially on "confirm" boxes
	 * @param {Object} options Besides the default YUI dialog options, use {singleton: true} to force only 1 open at a time
	 */
	show: function(text, callBackFn, options){
		var me = this;
		var defaults = {
			icon: "",
			header: "Alert",
			/** Allow only one instance of dialog at a time
			 * @config singleton
			 * @type Boolean
			 * @default false
			 */
			singleton: false
		}
		
		var cg = {
			text: text,
		    buttons: [ { text:"OK", handler:function(){
					me._executeFnAndHide(callBackFn);
				}, 
				isDefault:true } ]
		}
		$.extend(defaults, cg);
		$.extend(defaults, options);
		
		this._applyConfigAndShow(defaults);
	},
	/**
	 * Hides the popup from screen
	 */
	hide: function(){
		var dialog = this.alertDialog;
		dialog.hide();
	},
	
	/**
	 * Shows a modal popup; same as calling show with {modal:true}
	 * @param {String|HTML} text stuff to display in the popup
	 * @param {Function} callBackFn Executed on dialog close by default
	 * @param {Object} options Besides the default YUI dialog options, use {singleton: true} to have 1 at a time
	 */
	showModal: function(text, callback, options){
		var settings = $.extend(options, {modal: true});
		Dialogs.show(text, callback, settings);
	},
	/**
	 * @param {HTML} text 
	 * @param {Function} callBackFn  Have this false to stop dialog from closing; Useful for validators.
	 * @param {Object} options <optional>
	 */
	showAlert: function(text, callBackFn, options){
		var defaults =  {
			header: "Alert",
			icon: YAHOO.widget.SimpleDialog.ICON_INFO
		}
		$.extend(defaults, options);
		this.show(text, callBackFn,defaults);
	},
	showError: function(text, callBackFn, options){
		var defaults = {
			header: "Error",
			icon: YAHOO.widget.SimpleDialog.ICON_WARN
		};
		$.extend(defaults, options);
		this.show(text, callBackFn,defaults);
	},
	confirm: function(text, options){
		var me = this;
		var defaults = {
			header: "Confirm",
			icon: "",
			okText: "OK",
			onOK: null,
			cancelText: "Cancel",
			onCancel: null
		};
		$.extend(defaults, options);
		
		var cfg = {
			text: text,
			buttons: [ 
				{ 
					text: defaults.okText, handler:function(){
		    					me._executeFnAndHide(defaults.onOK);
							}, 
					isDefault:true 
				},
				{
					text: defaults.cancelText, handler: function(){
						me._executeFnAndHide(defaults.onCancel);
					}
				}
				]
		}
		$.extend(defaults, cfg);
		
		this._applyConfigAndShow(defaults);
	}
};