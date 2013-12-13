/*
    To check something aon all runs on given groups
    // to get all the groups in a given sim use the API call

    https://forio.com/simulate/api/usergroup/{client}/{sim}?format=LIST

    ej for sim project-management:
    https://forio.com/simulate/api/usergroup/harvard/project-management?format=LIST


    // or through the adapter: (logged in as admin in the sim)

    > F.API.UserGroup.getInfo('', function (info) { groups = info.groups }, {format:'LIST'})
    > _.pluck(groups, 'name'); // this will give you the array of group ids to past below in the groups var
*/

function scanGroups() {


    var groups = ["948cd373-6879-4d52-b635-af34ece40d75","b57a4914-01a9-4752-a72f-1602dbed5894","a8af987f-57fb-41d5-8887-a0a5794da607","3ba84396-1b61-440e-ad1d-2a145e58f36b","02f5119e-c81e-4643-b872-d7dd5435bdd7","b027f75c-3aae-48fe-a4c0-6a2fe2b33340","91545adb-4171-4fd5-b99e-54ac327b22f1","6e42d73f-9c7d-44d6-9f0a-6716e8c1ff20","2ce6b8d0-1c07-4e94-82c4-2c603a11cf21","75cc5227-9454-4ea4-982e-6ffd5253d1da","810e5dfd-041f-4fab-9635-6e491421fe26","87442587-6971-4461-9db1-d6c57d29402b","ddf64a91-935b-4e27-bd2c-0d8178cdb729","forio-sample","b000c128-7957-4061-b90b-e271efbfddb6","71f96425-dd0d-43fc-afc5-e27f3563d106","47e58d9d-cdc0-4e23-9e52-43bbdb75786c","30ce85aa-a468-4f2f-b712-1331b456b637","ubt","71b2be3d-ef16-4bfc-addf-94e83cf9c05c","40fc18e8-aac0-44a7-a9cc-dc24b8e04f00","f4cf5945-e649-43a0-9dbd-acc84891367f","4da0af2a-4224-4b0d-adb4-92e3e7f10236","6c6abfda-1eb0-4229-b8c9-4e82622daddc","4459c880-1da1-49b4-a068-e8cb02f307c5","04045fdc-4d68-4533-a947-84d74048d031","170a8fca-d03f-4c08-ba14-dcb38c56ff22","6a0e5b48-dfc5-4007-a6ce-370b177d9c43","a57ee804-d99c-4f35-8ae6-ad12ea68d9ed","9986010e-6187-445b-8047-c78d209e2406","e0e153de-8c7f-48cb-8bc4-0f94427faa71","1b2b6c21-fbf4-4282-b00f-083805b719c3","31bc306b-7d70-4065-b6a1-2082ebec4edb","pfizer-trial","ca16f538-f644-4ef6-91e5-70835393cf02","07230915-a085-4dad-b84f-157e94fe865f","SIMULATION_ROOT","7563ba25-5fc2-4ee8-a31e-3de92df1ed13","13e27a79-0faa-4f99-9ffb-f8b56ad88751","0905322c-8c52-4a44-b6fe-d84fb5284981","pfizer-development2","walpola","f39f28ef-20e2-4e93-92a0-2ba13bac850b","a75b1994-abb4-4417-9544-d71a6e214045","sso-group","ab6539e4-c126-44dd-82e3-48543e5db0ab","eb487dfc-7b37-4b35-b943-d8d316d3e917","6b657b29-e206-48f5-bfec-3440e4784dd6","46e36732-c005-4f3f-965b-f870ff94f37f","05acdcd0-7e56-4018-97c1-fbfca383a6ac","c41ee918-b822-41be-a404-a06eabbdda32","9310252f-339f-46bc-872d-fd7807c6158d","d43c00b4-f003-480d-a9ff-51cd6af6466e","ed917bd9-a177-4b56-8d48-2ad8ab669253","c95e5438-8976-499f-ac80-28cb65f7b308","12c9569c-4397-44bd-b5ce-a6cd00c24800","3c33d7d9-415a-440a-9b59-c35c65997b06","8b8e613b-3824-4332-aadf-370365e9f35d","4d523158-5c88-4385-bbf3-cef53aefc732","1c569dfb-bc8e-4a48-9504-0820ee33657c","4f851742-c9fb-4732-8f36-2d53fee90e71","fed02018-c305-4f78-8a16-69d0713f91c3","ffc75e8c-a2ae-47d0-90c2-1ef0ab8cac96","cdb066d5-0673-421c-8e0a-99132c48554c","2abe9322-2748-40b1-970d-93076f44b0aa","11779fc6-2d47-4bf5-a4e0-31629d878482","382d60c1-de0f-463b-8963-5c2f16262b51","ea5ce66a-6fdb-48cb-9f9b-8db37a6807ad","9eb0426e-2389-4ad6-9557-1a4af9656334","08362ca5-4f61-45c0-9f44-06ed9a054e52","cb9b6c94-a723-49a3-9a48-c2cc157df4f0","918ed631-ab72-433a-83f5-da2061c19e71","3ecbf141-07bb-412c-98c6-5e9cc040b56c","7dea0770-675f-45ee-9231-92079b1e33af","58eac529-9580-4491-ba9c-1766ad32d122","e436d614-40cc-4698-8eed-8366de2fc641","d2b2ece9-f493-4ee4-834c-2b3f307d1035","83df4a01-abdc-463d-978f-f78495f0ad54","15da0a57-a78d-4bd9-b71e-5ff733d5d4dc","d3e4e5a9-82d3-4357-986d-27b92d97254f","2ab6d323-84cb-4e6b-95bd-0c67026e9a66","3b9f2784-aefd-40b9-a1b9-c7cabe362a2c","89f5abc3-7e50-4b51-9994-78c806d0d949","fe249a61-0cb5-4dc2-9913-f1ecdee4007c","6c9be3e1-6468-4687-943d-7395ff0584a8","fad2d94a-05cf-487d-8e11-2da1f4c21403","977cc3a6-a678-4772-bb64-0d2ee64c7f1c","af84ddb9-6a8a-4e4c-90ec-75e4e27f09bf","5106e701-fd22-4e1f-95ea-68e0a7f67ded","88dd4683-6d8b-4a1b-9c7f-119707c795ed","d85f8d6b-b9df-453e-844a-147544bc5c79","1128fdf8-5c79-4c0c-b2dd-b4d1bfe7613c","ae6810de-570c-4cda-83f7-8c240709ad9e","0b2942bf-4f87-4452-bef7-3a5cdc5aba35","58b476f7-03aa-485c-b055-1150842c6751","24e0b466-1389-4181-bf4f-9df5b1c2de25","bocconi-trial","901c99af-0b43-46dc-8838-aac0cc7b9167","64e4023b-5dd2-4fbe-b4b3-04b0f123abf6","60d1d711-0d1b-4787-90c3-c2a68475b5e6","8142dd07-5129-403c-a7a0-dcb11e7be031","eacbfdf5-fd60-47fc-90f8-e9198654e84a","6c5231e8-b482-4c3d-aca7-880ad46138f5","f3cacb45-6e4c-4efc-96b8-cedb2efde00e","b8255431-12af-40d0-bc67-75bd3ef2ecf3","c4f1e695-ad9e-4801-a7f5-1fb2e1b33b9c","5c2ca4f3-6b19-44a6-a516-e3fb9b02891e","95db81c5-9aa2-4cd5-80d8-2974d001c73b","a2e39be4-12f9-44f7-b618-8295267228fb","65250cfc-1b39-42cb-8fba-6e808737f3af","08c9adfa-fbbf-4b73-8836-30eb9bf6a013","54b07e0c-266f-4f81-8b18-9b7ba5c6e5f7","9036c4b5-c472-4c99-94a3-276b234d6c39","2e503a7c-7f22-4864-97d3-1e325b7da39f","ec4527e2-45f8-4989-a712-a01151d85e42","7ccb8051-a588-4649-a4d2-a62a8ed5db77","01fd55f1-efa8-42c7-84bd-536aa0e6fe85","0049755d-00f9-44d6-a3d3-1491da6a17e0","7e61d197-9943-450e-a766-5b68e5ffc3f4","projectmanagementexperts-trial","pfizer","45499542-d1a6-4644-9778-ea4f0476e02f","b1fcdcb7-1d26-4d90-b37a-24505cf3cb1d","392134f3-a852-45c6-92cf-9d2ccac77a46","a61a5066-32ed-4cc2-b907-6cd24a92e9b5","selenium-test","8ce3428a-3118-48b3-af99-194c75ad31e5","bd0aa527-3a5f-4c6d-8657-6ead353b8d6f","hbp","ed8276b7-e1a7-4a1a-a05d-fa8ea6decebf","05b37032-cfb3-4828-aa98-d382a6f128cf","f1804ec0-5c44-4ab6-b109-c2081c89b683","f13a3e8e-862c-4616-965c-a20bf840797c","664ca385-34de-4077-96c4-9c0d96189cf6","f12d2aa2-0c75-46ca-a742-397b76ddeec9","88635635-00d6-44fc-b894-24cab59841fb","f64c02ce-64a1-46d7-b610-7dee0dfc1cdf","91c09b95-43e3-4a1f-8ef5-3550489b3813","12348148-f26e-4dec-89bb-4cdd933b90f6","sbJHsy_HBPCanvas","kat","7d669a67-79fe-433a-a9d2-9fefc3ab96b7","4f8456d9-3dc0-484e-9aac-7afd5f710bdf","2d8a6d16-cb96-4507-94cc-72d3a986046a","808ecb42-60b5-4a3b-8046-ed434b231eee","3e47e282-b9bb-41ec-9e05-cb264109fb6c","56d8b670-555e-4bc9-8b87-b678ea8559a0"];
    var queue = groups.slice();

    var vars = ['Team Size','Average Team Size','Milestone Completed','Project Completion Date','Score','Total Possible Points','Schedule Rating','Total Possible Points Target Schedule','Resources Rating','Total Possible Points Target Budget','Scope Rating','Total Possible Points Target Scope','Team Process Rating','Points Process','Project Completion Date Goal Decision','Planned Prototypes Decision','Target Scope Decision','Overtime Decision','Team Outsourcing Decision','Team Skill Level Decision','Team Size Decision','Tasks Completed',,'Management Target Schedule','Management Target Scope','Team Morale','Cumulative Cost','Average Morale','Average Stress','Negative Average Stress','Stress','Calculated Team Morale','Management Target Budget','Management Target Budget Adjusted','Metric1','Metric2','Metric3','Metric4','Metric5','Metric6','Metric7','Metric8','Metric9','Metric10','Metric11','Metric12','Metric13','Metric14','Metric15','Metric20','Metric21','Metric22','Metric30','Metric40'];

    function scanNext() {
        if (queue.length === 0)
            return;

        var gr = queue.pop();
        console.log('getting group: ' + gr);
        F.API.Archive.getRuns('', function (runs) {
            console.log('checking ' + runs.length + ' runs...');
            var corrupted = _.pluck(_.filter(runs, function (r) {

                // whatever to check for each run here

                return _.any(vars, function (v) { var vv = v.toLowerCase(); if(r.values[vv] == null) console.log(r.runId + ': ' + vv);  return r.values[vv] == null; });
            }), 'runId');


            if (corrupted.length > 0) {
                console.log('**** ' + corrupted.length + ' corrupted (of ' + runs.length + ' total runs)');
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
            //endTime: '<26',
            variables: vars.join(','),
            group_name: gr,
            // userLast: false
        });
    }

    scanNext();

}

scanGroups();
