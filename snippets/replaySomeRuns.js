
/* runsByUser should be a map of userPaths to an array of runIds to replay */
/* 
	{ 
		user1: [123, 234, 345],
		user2: [345ab, 6435a, 234sd, ...], 
		... 
	}

	NOTES: You need to be logged in as Simulate administrator to impersonate
*/

function replayRuns(runsByUser, groupId) {

	var users = _.keys(runsByUser);
	var user_count = 0;
	var user_total = _.keys.length;

	nextUser = function () {
		var user = users.pop();

		if (user) {
			F.API.Auth.impersonate(user, groupId, function() {
				var run_count = 0;
				var run_total = runsByUser[user].length;

				nextRun = function () {
					var runId = runsByUser[user].pop();

					if (runId) {

						F.API.Run.doActions("resume", runId, function() {
							F.API.Run.doActions('replay', '', function () {
								run_count++;
								console.log('(' + run_count + ' of ' + run_total + ') done with run ' + runId);
								nextRun();
							});
						});
					} else {
						console.log('done with user: ' + user);
						F.API.Auth.unimpersonate(nextUser);
					}
				};

				nextRun();
			});
		} else {
			console.log('done with all users!');
			F.API.Auth.unimpersonate();
		}
	};

	nextUser();
}