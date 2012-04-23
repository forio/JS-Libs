
F.API.Auth.getUserInfo(function(data){
    F.API.UserGroup.getInfo(data.userGroup.name, function(user){
        var userList = []
		for(var i=0; i< user.group.users.length; i++){
			if(!user.group.users[i].facilitator){
				userList.push(user.group.users[i].path)
			}
		}
		var startImpersonating = function(){
			var firstUser = userList.pop();
			console.log("Initializing " + firstUser + ". " + userList.length + " users remaining.");
			if(firstUser){
				
				F.API.Auth.impersonate(firstUser, "", function(){
					F.API.Archive.getRuns("saved=true&step=10&variables=$Fired^&facilitator=false", function(data){
						var runs = []
						for(var i=0; i< data.run.length; i++){
							runs.push(data.run[i].runId)
						}
						
						console.log("found",runs.length, "runs" );
						var start = function(){
							var firstRun = runs.pop();
							console.log("Initializing " + firstRun + ". " + runs.length + " runs remaining.");
							if(firstRun){
									F.API.Run.doActions("resume", firstRun, function(){
										F.API.Run.doActions("replay", firstRun, function(){
											F.API.Run.setProperties({saved:true}, start)
										});
									})
							}
							else{
								console.log("All runs complete for", firstUser);
								F.API.Auth.unimpersonate(startImpersonating)
							}
						}
						start()
					})
				});
			}
			else{
				console.log("All users done");
			}
		}
		F.API.UserGroup.resetRunLimit(null,startImpersonating)
	})
})