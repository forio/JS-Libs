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
		// console.log("F.Comet: connection success", message, callback)
		//Unsubscribe older events and resubscribe them
		//TODO: why do i have to do this and not the lib?
		//TODO: why not do _clearSubscriptions(); That's being called during handshake anyway? or clearSubscriptions & clearListeners
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
	};
	
	var connectionBroken = function(message, callback){
		callback(message);
	};
	
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
		/** Send message on channel
		 * 
		 * @param {Object} channel
		 * @param {Object} message
		 */
		publish: function(channel, message){
			cometd.publish(channel, message);
		},
		
		/** Intialize connection to server and handshake
		 * @param cometURL - URL of comet server
		 * @param options
		 */
		init: function(cometURL, options, cometOptions){
			//console.log("F.comet.init", cometURL, options, cometOptions);
			//var cometURL = "http://channel1.forio.com/cometd/";
	      	if(!cometURL){
	      		throw new Error("F.Comet: No URL provided");	
	      	}
	      	
			//TODO: Document this with the default fns from the lib
			var defaultCometOptions = {
	            url: cometURL,
	            logLevel: 'info'
	        };
	        $.extend(defaultCometOptions, cometOptions);
	        
	        var defaults = {
	        	/** Connection success handler
				 * @config onConnect
				 * @type Function
				 */
	        	onConnect: $.noop,
				
				/** Connection failure handler
				 * @config onConnect
				 * @type Function
				 */
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
		var payload = msg.data;
		
		var data = (payload && F.isArray(payload)) ? payload[0] : payload;
		
	//	var data = (msg.data && msg.data[0]) ? msg.data[0] : {}; //Simulate returns data as an array for some reason
		var msgType = data.type;
		switch(msgType){
			case "MODEL_RECALCULATED":
				//console.log("MODEL_RECALCULATED", data)
				MChannel.ModelRecalcEvent.fire(data);
				break;
			case "STEP_CHANGED":
				MChannel.StepChangeEvent.fire(data);
				break;
			case "CHAT_MESSAGE":
				MChannel.ChatMsgEvent.fire(data);
				break;
			case "PLAYER_STATUS":
				MChannel.PlayerStatusEvent.fire(data);
				break;
			case "NEW_RUN":
				MChannel.NewRunEvent.fire(data);
				break;
			case "CUSTOM_EVENT":
				MChannel.customMsgEvent.fire(data.msg);
				break;
			default:
				//console.log("default msg");
				var c=1;
		}
	};
	
	return{
		NewRunEvent:  new YAHOO.util.CustomEvent("newRun", this, true, YAHOO.util.CustomEvent.FLAT),
		StepChangeEvent:  new YAHOO.util.CustomEvent("stepchanged", this, true, YAHOO.util.CustomEvent.FLAT),
		ModelRecalcEvent: new YAHOO.util.CustomEvent("modelchanged", this, true, YAHOO.util.CustomEvent.FLAT),
		ChatMsgEvent: new YAHOO.util.CustomEvent("chatMessage", this, true, YAHOO.util.CustomEvent.FLAT),
		PlayerStatusEvent: new YAHOO.util.CustomEvent("playerStatus", this, true, YAHOO.util.CustomEvent.FLAT),
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
		
		//Custom events
		broadcastMessage: function(message, channel){
			channel || (channel = teamChannel);
			
			var msg = [{
				type: "CUSTOM_EVENT",
				msg: message
			}];
			//console.log("broadcastMessage", msg)
			F.Comet.publish(channel, msg);
		},
		
		sendChat: function(msg, channel){
			channel || (channel = teamChannel);
			F.Comet.publish(channel, msg);
		}
	}
}();

/**
 * @see https://sites.google.com/a/forio.com/documentation/chat-message-format
 */
MChannel.Chat = function(){
	var userId, userNick;
	var ALL = "*";
	
	var Chatmessage = function(msgto,toNick, msgdata){
		toNick || (toNick = msgto);
		var now = new Date();
   		var currtimeStamp = now.valueOf();
		
		return[{
			type: "CHAT_MESSAGE",
			time: currtimeStamp,
			data: {
				to: msgto,
				toNickname: toNick,
				fromNickname: userNick,
				fromName: userNick,
				message: msgdata,
				isPrivate: (msgto !== ALL)
			},
			generator: {
				path: userId
			}
		}]
	}
	
	return{
		incomingMsgEvent:  new YAHOO.util.CustomEvent("incomingMsg", this, true, YAHOO.util.CustomEvent.FLAT),
		playerJoinEvent:  new YAHOO.util.CustomEvent("playerJoined", this, true, YAHOO.util.CustomEvent.FLAT),
		playerLeaveEvent:  new YAHOO.util.CustomEvent("playerLeft", this, true, YAHOO.util.CustomEvent.FLAT),
		
		sendMessage: function(to, toNick, message, channel){
			var msg = new Chatmessage(to,toNick, message);
			MChannel.sendChat(msg, channel);
			//TODO: Should i create a new channel for chat?
		},
		
		/**
		 * 
		 * @param {Object} myId
		 * @param {Object} myNick
		 * @param {Object} args  -
		 * @param {Object} options - Cometd options
		 */
		init: function(myId, myNick, args, options){
			userId = myId + "";
			userNick = (myNick) ? myNick : myId;
			
			MChannel.init(args, options);
			MChannel.PlayerStatusEvent.subscribe(function(msg){
			//	console.log(msg)
				var subType = msg.subType.toLowerCase();
				switch(subType){
					case "left":
						MChannel.Chat.playerLeaveEvent.fire(msg.generator, msg);
						break;
					
					case "joined":
						MChannel.Chat.playerJoinEvent.fire(msg.generator, msg);
						break;
				}
			});
			MChannel.ChatMsgEvent.subscribe(function(msg){
				var data = msg.data;
				
				var msgFrom = msg.generator.path;
				var msgTo = data.to;
					
				if(msgFrom !== userId && (msgTo == ALL || msgTo == userId) ){
					MChannel.Chat.incomingMsgEvent.fire(msg);
				}
			});
		}
	}
}();

var DecnMonitor = function(options){
	var conditionCallBackList = {} //{Condition: Callback}
	
	var matchName = function(decnname, condition){
		//TODO: Eventually make this smarter: Regex, wildcards etc
		decnname =  decnname.toLowerCase();
		var ismatch = (decnname.indexOf(condition.toLowerCase()) !== -1);
		//var ismatch = (decnname.substr(0, condition.length) === condition)
		//FIXME: This is broken; this will basically match "has auction" and also "has auction fac"
		
		return ismatch;
	}
	
	var matchVal = function(decnVal, conditionVal){
		//TODO: Make this handle > symbols, != symbols etc
		var ismatch  = (decnVal === undefined || parseFloat(decnVal) === parseFloat(conditionVal));
		return ismatch;
	}
	
	var reformatdata = function(allDecns){
		var reformatted = {};
		//Make Simulate's ugly array an useful js hash
		for(var decn in allDecns){
			var thisDecn = allDecns[decn];
			var decnname = thisDecn.name.toLowerCase();
			
			var decn = thisDecn.decision;
			var decnFormatted = thisDecn.decisionFormatted;
			
			reformatted[decnname] = {
				"decision": decn,
				"decisionFormatted": decnFormatted
			}
		}
		return reformatted;
	}
	var changeHandler = function(data){
		var  changedDecns = data.run.values;
		//console.log("DecnMonitor.changeHandler", changedDecns);
		for(var condition in conditionCallBackList){
			var conditionName = condition.split("=")[0];
			var val = condition.split("=")[1];
			var cb = conditionCallBackList[condition];
			
			for(var decn in changedDecns){
				var thisdecn = changedDecns[decn];
				if(matchName(thisdecn.name, conditionName) && matchVal(val, thisdecn.decision)){
					cb(reformatdata(changedDecns), data)
				}
			}
		}
	}
	
	MChannel.ModelRecalcEvent.subscribe(changeHandler, this);
	return{
		bind: function(condition, callback){
			conditionCallBackList[condition] = callback;
		},
		unbind: function(condition){
			delete conditionCallBackList[condition];
		},
		getListener: function(condition){
			return conditionCallBackList[condition];
		},
		clearListeners: function(){
			conditionCallBackList = {};
		}
	}
};
