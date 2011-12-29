
F.MChannel = (function(){
	return{
		modelRecalc: "",
		
		decisionMade: ""
		
		
	}
}());

F.Comet = function(){
	var cometd = $.cometd;
	 
	var activeChannels = {}; // {channelId: [subsObj1, subsObj2]
	var subscriptions = {}; // {<subsid>: [fn1, fn2]
	
	var isConnected = false; //Flag showing status of connection;
	var isInitialized = false;
	
	var connectionSucceeded = function(message, callback){
//		 console.log("F.Comet: connection success", message, callback)
		//Unsubscribe older events and resubscribe them
		//TODO: why do i have to do this and not the lib?
		//TODO: why not do _clearSubscriptions(); ?
        cometd.batch(function(){
        	for(var channel in activeChannels){
        		var channelSubscriptions = activeChannels[channel];
        		for(var subscription in channelSubscriptions){
        			var thissubs = channelSubscriptions[subscription];
        			cometd.unsubscribe(thissubs)
        		}
        	}
        	
        	for(var channel in activeChannels){
        		var channelSubscriptions = activeChannels[channel];
        		for(var subscription in channelSubscriptions){
        			var thissubs = channelSubscriptions[subscription];
        			
        			var subsFns = subscriptions[thissubs];
        			for(var fn in subsFns){
        				var thisFn = subsFns[fn];
        				cometd.subscribe(channel, thisFn);
        			}
        		}
        	}
        	
        	isInitialized = true;
        });
        
        callback(message);
	}
	
	var connectionBroken = function(message, callback){
		callback(message);
	}
	
	// Disconnect when the page unloads
    $(window).unload(function(){
    	if(cometd)
        cometd.disconnect();
        isInitialized = false;
    });

	
	return{
		//connectEvent
		subscribe: function(channel, handler){
			var thissub = cometd.subscribe(channel, handler);
			
			//Add to channels
			var subs = (activeChannels[channel]) || [];
			if(!F.Array.contains(thissub, subs)){
				subs.push(thissub);
			}
				
			activeChannels[channel] = subs;
			
			//Add handler to subs
			var handlers =  (subscriptions[thissub]) || [];
			if(!F.Array.contains(handler, handlers)){
				handlers.push(handler);
			}
			subscriptions[thissub] = handlers;
		},
		
		publish: function(channel, message){
			cometd.publish(channel, message);
		},
		
		/**
		 * @param cometURL - URL of comet server
		 * @param options
		 */
		init: function(cometURL, options, cometOptions){
//			console.log("F.comet.init", cometURL, options, cometOptions);
			//var cometURL = "http://channel1.forio.com/cometd/";
	      	if(!cometURL){
	      		throw new Error("F.Comet: No URL provided");	
	      	}
	      	
			var defaultCometOptions = {
	            url: cometURL,
	            logLevel: 'info'
	        }
	        $.extend(defaultCometOptions, cometOptions);
	        
	        var defaults = {
	        	/** Execute on connection established
				 * @config onConnect
				 * @type Function
				 */
	        	onConnect: $.noop,
	        	onDisconnect: $.noop
	        }
	        $.extend(defaults, options);
	        
			cometd.configure(defaultCometOptions);
	
			/* /meta/connect is a bayeux-defined comet channel
			 * Use to listen for error messages from server. E.g: Network error
			 */
	        cometd.addListener('/meta/connect', function(message){
	       		var wasConnected = isConnected;
	            isConnected = (message.successful === true);
	            if (!wasConnected && isConnected){ //Connecting for the first time
	                connectionSucceeded(message, defaults.onConnect);
	            }
	            else if (wasConnected && !isConnected) {
	                connectionBroken(message, defaults.onDisconnect);
	            }
	        });
	
	        /* Service channels are for request-response type commn.
	         * 
	         */
//	         cometd.addListener('/meta/connect', function(message){
//	        });
//	        
	        cometd.handshake();
		}
	}
}();

//""

var MChannel = function(){
	var url, teamChannel;
	var initialized;
	
	var handleSimulateEvent = function(msg){
		//console.log("handleSimulateEvent", msg)
		var data = (msg.data && msg.data[0]) ? msg.data[0] : {};
		var msgType = data.type;
		switch(msgType){
			case "MODEL_RECALCULATED":
				console.log("MODEL_RECALCULATED", data)
				MChannel.ModelRecalcEvent.fire(data);
				break;
			case "STEP_CHANGED":
				MChannel.StepChangeEvent.fire(data);
				break;
			case "CUSTOM_EVENT":
				MChannel.customMsgEvent.fire(data.msg);
				break;
			default:
				//console.log("default msg");
				var c=1;
		}
	}
	
	return{
		StepChangeEvent:  new YAHOO.util.CustomEvent("stepchanged", this, true, YAHOO.util.CustomEvent.FLAT),
		ModelRecalcEvent: new YAHOO.util.CustomEvent("modelchanged", this, true, YAHOO.util.CustomEvent.FLAT),
		customMsgEvent: new YAHOO.util.CustomEvent("custommsg", this, true, YAHOO.util.CustomEvent.FLAT),
		
		init: function(args, options){
			if(!initialized){
				initialized = true;
				url = args.url;
				teamChannel = args.teamChannel;
				
				F.Comet.init(url, options);
				F.Comet.subscribe(teamChannel, handleSimulateEvent);
			}
		},
		
		broadcastMessage: function(message, channel){
			channel || (channel = teamChannel);
			
			var msg = [{
				autoGenerated: false,
				type: "CUSTOM_EVENT",
				msg: message
			}]
			//console.log("broadcastMessage", msg)
			F.Comet.publish(channel, msg);
		}
	}
}();

MChannel.Chat = function(){
	var userId;
	var now = new Date();
    var currtimeStamp = now.toLocaleTimeString();
	var Chatmessage = function(msgto, msgdata){
		return{
			subtype: "CHAT_MESSAGE",
			from: userId,
			to: msgto + "",
			data: msgdata,
			timeStamp : currtimeStamp
		}
	}
	
	return{
		incomingMsgEvent:  new YAHOO.util.CustomEvent("incomingMsg", this, true, YAHOO.util.CustomEvent.FLAT),
		sendMessage: function(to, message){
			var msg = new Chatmessage(to,message);
			MChannel.broadcastMessage(msg);
			//TODO: Should i create a new channel for chat?
		},
		init: function(myId, args, options){
			userId = myId + "";
			
			MChannel.init(args, options);
			MChannel.customMsgEvent.subscribe(function(data){
				var subtype = data.subtype;
				
				if(subtype && subtype == "CHAT_MESSAGE"){
					var msgFrom = data.from;
					var payload = data.data;
					//console.log("firing", payload)
					
					if(msgFrom !== userId){
						MChannel.Chat.incomingMsgEvent.fire(data);
					}
				}
			})
		}
	}
}()

F.API.Game = (function(){
	var url = F.APIUtils.getURL("game");

	return{
		create: function(noOfGames, callback, params, options){
			(noOfGames) || (noOfGames = 1);
			var defaults = {
				name: "",
				key: "",
				games: noOfGames
			}
			$.extend(defaults, params);
			
			var ac = new APIConnection(url, options);
				ac.post(defaults, function(response){
					var data = response.games;
					(callback || $.noop)(data);
				});
		},
		join: function(gameId, userId, callback, options){
			var params = {
				userPath: userId
			}
			var ac = new APIConnection(url + "/" + gameId, options);
				ac.post(params, function(response){
					var data = response.game;
					(callback || $.noop)(data);
				});
		},
		
		quit: function(gameId, role, callback, options){
			var ac = new APIConnection(url + "/" + gameId + "/" + role, options);
				ac.post("method=DELETE", function(response){
					var data = response.data;
					(callback || $.noop)(data);
				})
		}
	}

}());