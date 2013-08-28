
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
    {
        user1: [123, 234, 345],
        user2: [345ab, 6435a, 234sd, ...],
        ...
    }

    NOTES: You need to be logged in as Simulate administrator to impersonate
*/

function replayRuns(runsByUser, groupId) {

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

F.API.Archive.getRuns('', function (r) { runs = r; }, { format: 'concise', variables: [], facilitator: false });

byUser = {};

_.each(runs, function (r) { groupId = r.userGroup.name; byUser[r.user.path] = byUser[r.user.path] || []; byUser[r.user.path].push(r.runId); });

replayRuns(byUser, groupId);
