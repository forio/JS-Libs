
$(document).ready(function(){
    if(document.getElementById("loginDialog")){
        Dialogs.init("loginDialog");

    }

    $('#forgotPassButton').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        F.API.Auth.sendPassword($('#txtUserName').val(), function(response){
            if(response.status == "201"){
                if(document.getElementById("message")){
                    $("#message")
                        .text('E-mail sent!')
                        .removeClass("")
                        .addClass("info")
                        .show();
                }
            }
            else{
                F.Net.goToURL("login.html?msg=psent");
            }
        });
    });

    $("#demoLoginSelect").change(function(){
        if(this.value !== "other"){
            $("#userName")
                .hide();
            var username =  $("#demoLoginSelect :selected").text().replace(/ /g, "");

            $("#txtUserName").val(username);
            $("#txtPasswd").val($(this).val());
        }
        else{
            $("#userName")
                .show()
            $("#F_login_fields :text, #F_login_fields :password")
                    .val("");
        }
    })
    $("#login, form:has(#btnLogin)").submit(function(evt){
        evt.preventDefault();
        var userName = $("#txtUserName").val()
        var passwd = $("#txtPasswd").val();

        F.API.Auth.login(userName, passwd, function(loginInfo){
            if(loginInfo.canRunSim){
                var location = window.location.href.replace('login.html', '');
                window.location.assign(location);
            }
            else if(loginInfo.userGroups && loginInfo.userGroups.length > 0){
                var str = "<select id=\"group_selected\">";

                for(i=0;i<loginInfo.userGroups.length;i++){
                    var group = loginInfo.userGroups[i];
                    if(group.description) var groupLabel = group.description + ", (" + group.name + ")";
                    else var groupLabel = group.name
                    str += "<option value=\""+group.name+"\">"+groupLabel+"</option>";
                }
                str += "</select><p style=\"padding-top:12px;\"><input class=\"leave_group\" type=\"submit\" value=\"&laquo; Log out\" /><input class=\"join_group\" style=\"float: right;\" type=\"submit\" value=\"Log in &raquo;\" /></p>";
                var dialogHeader = "Choose the code for your class and section:";

                Dialogs.show(str,null,{
                    icon: "",
                    width: "340px",
                    header: dialogHeader,
                    modal: true,
                    buttons: []
                });
                $(".join_group").click(function(e){
                    e.preventDefault();
                    var group = $("#group_selected").val();
                    F.API.Auth.loginGroup(group,function(){
                        F.Net.goToURL("index.html");
                    });
                });
                $(".leave_group").click(function(e){
                    e.preventDefault();
                    F.API.Auth.logout(function(){
                        F.Net.goToURL("login.html");
                    });
                });
            }
            else{
                $("body").trigger("loginFailure", loginInfo.message);
                if(document.getElementById("message")){
                    $("#message")
                        .text(loginInfo.message)
                        .removeClass("")
                        .addClass("error")
                        .show();
                }
                else{
                    alert(loginInfo.message)
                }
            }
         },{token:true});
    });
});
