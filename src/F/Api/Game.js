
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