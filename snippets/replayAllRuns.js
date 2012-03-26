
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
			if(firstUser){
				
				F.API.Auth.impersonate(firstUser, "", function(){
					F.API.Archive.getRuns("saved=true&step=10&variables=$Fired^&facilitator=false", function(data){
						var runs = []
						for(var i=0; i< data.run.length; i++){
							runs.push(data.run[i].runId)
						}
						
						var start = function(){
							var firstRun = runs.pop();
							if(firstRun){
									F.API.Run.doActions("resume", firstRun, function(){
										F.API.Run.doActions("replay", firstRun, start);
									})
							}
							else{
								console.log("All runs complete");
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