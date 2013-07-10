/*
    To check something aon all runs on given groups
*/

function scanGroups() {


    var groups = [ /* insert all group IDs here */];
    var queue = groups.slice();


    function scanNext() {
        if (queue.length === 0)
            return;

        var gr = queue.pop();
        console.log('getting group: ' + gr);
        F.API.Archive.getRuns('', function (runs) {
            console.log('checking ' + runs.length + ' runs...');
            var corrupted = _.pluck(_.filter(runs, function (r) {

                // whatever to check for each run here

                return r.values.metric8.result === 0;
            }), 'runId');


            if (corrupted.length > 0) {
                console.log('**** ' + corrupted.length + ' corrupted');
                console.log(corrupted.join(','));
            } else  {
                console.log('0 corrupted');
            }


            scanNext();
        },
        {
            // filter for the archive api call
            format: 'concise',
            step: '>0',
            endTime: '<26',
            variables: 'metric8',
            group_name: gr
        });
    }

    scanNext();

}

scanGroups();
