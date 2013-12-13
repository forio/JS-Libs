
function replayOne(runId, user, groupId) {
    F.API.Auth.impersonate(user, groupId, function () {
        F.API.Run.doActions('resume', runId, function () {
            F.API.Run.doActions('replay', '', function () {
                F.API.Auth.unimpersonate(function () {
                    console.log('done');
                });
            });
        });
    });
}


/* runsByUser should be a map of userPaths to an array of runIds to replay */
/*
<<<<<<< HEAD
	{
		user1: [123, 234, 345],
		user2: [345ab, 6435a, 234sd, ...],
		...
	}

	NOTES: You need to be logged in as Simulate administrator to impersonate
=======
    {
        user1: [123, 234, 345],
        user2: [345ab, 6435a, 234sd, ...],
        ...
    }

    NOTES: You need to be logged in as Simulate administrator to impersonate
>>>>>>> 9437e235f9a984c7cc5c52ea899596188f537f7c
*/

{
    "pgp12.kashvi": ["51b1d47de4b0b6d3c4d0cdea"],
    "pgp12.avi" : ["51b1c01ce4b0b6d3c4d0cd8d"],
    "pgp12.apurva" : ["51b1b8a9e4b0b6d3c4d0cd3c", "51b1c342e4b0b6d3c4d0cdab"],
    "pgp12.ian": ["51b1bd38e4b0b6d3c4d0cd70", "51b1e08de4b0b6d3c4d0ce1f"],
    "pgp12.payal" : ["51b1b9d9e4b0b6d3c4d0cd4e", "51b1be49e4b0b6d3c4d0cd7c", "51b189d8e4b0b6d3c4d0cc3b"],
    "pgp12.debopam": ["51b170e6e4b0b6d3c4d0cb9f"],
    "pgp12.abha": ["51b1ce48e4b0b6d3c4d0cdd6"],
    "pgp12.maneesh": ["51b1febfe4b0b6d3c4d0cf12"],
    "pgp12.namrata": ["51b1b45ee4b0b6d3c4d0cd23"],
    "pgp12.phanindra": ["51b1d6ebe4b0b6d3c4d0cdf0"]
}
group = "9036c4b5-c472-4c99-94a3-276b234d6c39"

function replayRuns(runsByUser, groupId) {

<<<<<<< HEAD
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
=======
    // global!! (no var) so you can stop the run from outside this function
    stopRun = false;

    var users = _.keys(runsByUser);
    var user_count = 0;
    var user_total = users.length;
    var pauseBetweenReplays = 10000; // in ms
    var now = function () { return new Date().toLocaleTimeString(); };

    console.log(now() + ': # users: ' + user_total);

    nextUser = function () {
        var user = users.pop();

        if (user) {
            console.log('trying for user ' + user + ' on gr ' + groupId);
            F.API.Auth.impersonate(user, groupId, function() {
                var run_count = 0;
                var run_total = runsByUser[user].length;

                nextRun = function () {
                    var runId = runsByUser[user].pop();

                    if (runId) {
                        console.log(now() + ': starting with next run ' + runId);
                        F.API.Run.doActions("resume", runId, function() {
                            F.API.Run.doActions('replay', '', function () {
                                run_count++;
                                console.log(now() + ': (' + run_count + ' of ' + run_total + ') done with run ' + runId);
                                nextRun();
                            });
                        });
                    } else {
                        user_count++;
                        console.log(now() + ': done with user (' + user_count + ' of ' + user_total +'): ' + user);
                        F.API.Auth.unimpersonate(function () {
                            if (!stopRun) {
                                setTimeout(nextUser, pauseBetweenReplays);
                            }
                        });
                    }
                };

                nextRun();
            });
        } else {
            console.log(now() + ': done with all users!');
            F.API.Auth.unimpersonate();
        }
    };

    nextUser();
}

F.API.Archive.getRuns('', function (r) { runs = r.run; }, { format: 'concise', variables: [], facilitator: false });

byUser = {};

_.each(runs, function (r) { groupId = r.userGroup.name; byUser[r.user.path] = byUser[r.user.path] || []; byUser[r.user.path].push(r.runId); });

replayRuns(byUser, groupId);
>>>>>>> 9437e235f9a984c7cc5c52ea899596188f537f7c
