//After being logged in as an admin
GROUP_TO_COPY_FROM = "harvardtest";
SIM_TO_COPY_TO = "/harvard/innovation-demo";
GROUP_TO_COPY_TO = "default";

F.API.Archive.getRuns("saved=true&step=10&variables=$Fired^&facilitator=false&group_name=" + GROUP_TO_COPY_FROM, function(pretty, data){
	var runs = [];
	var users = [];
	for(var i=0; i< data.run.length; i++){
		runs.push(data.run[i].runId)
		users.push(data.run[i].user.path)
	}

	console.log("found",runs.length, "runs" );
	var start = function(data){
		if(data) console.log(data)
		var firstRun = runs.pop();
		var user = users.pop();
		console.log("Initializing " + firstRun + ". for user " + user  + ". " + runs.length + " runs left");
		if(firstRun){
			var params = [
				"run_action=copy",
				"method=post",
				"group_name=" + GROUP_TO_COPY_FROM,
				"run="+ firstRun,
				"toUserEmail="+ user,
				"toGroupName=" + GROUP_TO_COPY_TO,
				"toSimulationPath=" + SIM_TO_COPY_TO
			]
			params = params.join("&")
			F.API.Archive.connect(params, start);
		}
		else{
			console.log("All runs complete");
		}
	}
	start()
})
