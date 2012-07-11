/* Utility functions for navigation.*
 */
/** Setup google analytics **/
var ANALYTICS_CODE = 'UA-9758454-7'
var _gaq = _gaq || [];
_gaq.push(['_setAccount', ANALYTICS_CODE]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
				
			
var Nav = function(){
	var History = YAHOO.util.History;

	var startPage = "";
	var module = 'page'; //Random name for the bookmarkmanager to use;
	
	var runParams = ""; //Stuff to post to run api on tab change
	var pagePostParams = "";
	
	var loadCallback = $.noop;
	
	var pageNameFromLink = function($link){// Prettify name for url
		var text = $link.data("title");
		if(!text)
			text = $.trim($link.text()).toLowerCase().replace(" ", "_");

			return text;
	};
	var linkFromPageName = function(page){
		var link = "";
		$("#F_navigation li a:not('.nofollow')").each(function(){
			if(pageNameFromLink($(this)) == page){
				link = this;
			}
		});
		return link;
	}
	
	var UIstateChangeHandler =  function(page, postparams, options) {
	 	//Has to be non-private as yui uses this
			
		var params = "";
		if(page.indexOf("?") !== -1){
			params = page.substr(page.indexOf("?"), page.length);
			page = page.replace(params, "");
		}
		
		var targetLink = linkFromPageName(page);
		var targetHref = $(targetLink).attr("href") + params;
		
		$('#F_navigation li.selected').removeClass('selected');
		var tabid = $(targetLink)
						.parents("li")
							.addClass('selected');
		Nav.loadPage(targetHref, postparams, options);
	}
	
	/** Taken from SWFObject's remove method **/
	function removeSWF(obj) {
		if(obj && F.isElement(obj)){
			obj.style.display = "none";
			if (obj.readyState == 4) {
				for (var i in obj) {
					if (typeof obj[i] == "function") {
						obj[i] = null;
					}
				}
				obj.parentNode.removeChild(obj);
			}
			else {
				setTimeout(arguments.callee, 10);
			}
		}
		
	}
			
	return{
		/**
		 * Switches page; Figures out which tab its in & switches to that.
		 * @param {String} Name of the page you want to go to; not the url
		 * @param {Object|String} stuff you want to post to the target page
		 */
		goToPage: function(pageName, params, options){
			if(pageName == Nav.getCurrentPage()){
				Nav.refreshPage(params, options);
			}
			else{
				pagePostParams = params;
				loadCallback = (options) ? options.callback : $.noop;
				
				History.navigate(module, pageName);
			}
		},

		/**
		 * @param {String}        url                  Absolute/relative url of stuff you want to load in
		 * @param {Object|String} params   [Optional]  Stuff you want to post to the target page
		 * @param {Function}      options.callback [Optional]  What to do after you're done loading
		 * @param {String||HTMLElement} options.target [Optional] id/elem Where you want to load it to
		 */
		loadPage:function(url,params, options){
			(params) || (params = pagePostParams);
			
			var settings = {
				target : "#content",
				callback: loadCallback,
				noParse: false,
				flashCleanup: true
			};
			$.extend(settings, options);
			
			var page = $(settings.target);
			
			$("#loading_msg").show().find("p").html("Loading, please wait...");
			//$(page)
			//	.prepend("<div id='loadingMsg'><div><p>Loading</p><img src='img/loading_big.gif' alt='loading' /></div></div>")
			
			var ieSWFCleanup = function(){
				//Function to clean up swfs to fix ie memory leak; Should return true or false
				var ieObjects = $("object").get();
				if(ieObjects.length > 0 && YAHOO.env.ua.ie && YAHOO.env.ua.ie < 9){
					for(var i= 0; i < ieObjects.length; i++){
						removeSWF(ieObjects[i]);
				  	}
				  	return false;
				}
				return true;
			};
			
			var connsettings = {
				onSuccess: function(data){
					settings.callback();
				},
				onComplete: function(data){
					$("#loading_msg").hide();
					$(page).html(data);
				},
				onError: function(errorMessage, errorThrown){
					if(errorMessage.status == 403 || errorMessage.status == 401){
						//Goto login page
						window.location.reload();//Should auto redirect to login page if sim is configured right
					}
					else{
						var errMess = errorMessage.status + " : " +  errorMessage.message;
						$("#content").html(errMess);
					}
				},
				preloadCondition: (settings.flashCleanup) ? ieSWFCleanup : function(){return true;}

			}
	
			if(runParams){
				var runURL = F.APIUtils.getURL("run");
				//TODO: Combine pagePostParams as part of the url string for the return file;
				var conn = new APIConnection(runURL, {target : url}, connsettings);
					conn.getHTML(runParams);
			}
			else{
				var qs = (settings.noParse == true) ? params :   F.makeQueryString(params);
				var conn = new AjaxConnection(url, connsettings);
					conn.getHTML(qs);
			}

			runParams = "";
			pagePostParams = ""; 	// Because Yahoo refuses to pass params to bookmarked locns  use a global apram obj
			loadCallback = $.noop;
			
		},
		/** Refreshes the page only if the user is currently on it. Userful for multiplayer stuff.
		 * @param {String} page
		 */
		updatePage: function(page, params){
			var pages = [].concat(page);
			var currPage = Nav.getCurrentPage();
			for(var i=0; i< pages.length; i++){
				if(currPage == pages[i]){
					this.refreshPage(params);
				}
			}
		},
		/** HardRefresh.
		 */
		refreshPage: function(params, options){
			var page = Nav.getCurrentPage();
			UIstateChangeHandler(page, params, options);
		},
		/**
		 * @return {String} Name of the current sub-section with the main tabs
		 */
		getCurrentPage:function(){
			var cp = History.getBookmarkedState(module);
			if(!cp){
				cp = startPage;
			}
			return cp;
		},
		init: function(){
			YAHOO.util.Event.onDOMReady(function(){
				//Check if there is a default start page specified
				var $startPage = $("a#startPage").length > 0
									? $("a#startPage") 
									: $("#F_navigation li:not(.main):first a:first:not(.nofollow)");
				startPage = pageNameFromLink($startPage);
				
				var bookmarkedState = History.getBookmarkedState(module);
				var initialState = bookmarkedState || startPage;
				
				History.register(module, initialState, UIstateChangeHandler);
				History.onReady(function(){UIstateChangeHandler(History.getCurrentState(module));});
				History.initialize('yui-history-field', 'yui-history-iframe');
				

				$("#F_navigation")
					.delegate(" li a:not('.nofollow')", "click.navigate", function(evt){
						evt.preventDefault(); 
						if ($(this).parent().hasClass('selected')) return;
						var pageName = pageNameFromLink($(this))
						History.navigate(module, pageName);
					})
					.delegate(" li a:not('.nofollow')", "click.analytics", function(evt){
						evt.preventDefault(); 
						var pageName = pageNameFromLink($(this))
   						_gaq.push(['_setAccount', ANALYTICS_CODE]);
       				    _gaq.push(['_trackPageview', "/" + F.APIUtils.simulatePath + "/" + F.APIUtils.userPath  + "/" + F.APIUtils.simPath + "/" + pageName]);
					})
					.delegate("li.main", "click.navigate", function(evt){
						var target = $(this).next().children("a:not('.nofollow')");
						target.trigger("click.navigate");
					});
			});
		}()
	};
}();