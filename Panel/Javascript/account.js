var busy = false;
function doAccountChangePassword() {
    if(busy) return;
    busy = true;

    var error = undefined;
    if((error = accountValidatePassword())    != undefined) {
        // Error;
        alertify.delay(5000).error(`Error: ` + error);
        busy = false;
        return;
    }

    accountChangePassword($('#account-tab-current-password').val(), $('#account-tab-new-password').val());
}

function doAccountChangeApiKey() {
    if(busy) return;
    busy = true;

    accountChangeApiKey();
    document.getElementById("account-refresh-token-button").disabled = true;
}

function accountValidatePassword() {
    var old = $('#account-tab-current-password').val();
    var password = $('#account-tab-new-password').val();
    var repeat = $('#account-tab-new-password-repeat').val();
    
    if(old.length > 64 || old.length < 6) return 'Invalid old password';
    if(password.length > 64 || password.length < 6) return 'New password length must be between 6-64';
    if(password != repeat)                          return 'New Passwords did not match';
    return undefined;
}

function accountChangePassword(old_password, new_password) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) alertify.delay(5000).error(`Error: unexpected error occured, try again later.`);
            else {
                var parsed = JSON.parse(this.responseText);
                if(parsed.success) {
                    alertify.delay(5000).success(`Password changed.`);
                    $('#account-tab-current-password').val("");
                    $('#account-tab-new-password').val("");
                    $('#account-tab-new-password-repeat').val("");
                }
                else {
                    alertify.delay(5000).error(`Error: old password did not match.`);
                    $('#account-tab-current-password').val("");
                }    
            }

            busy = false;
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/password_change", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        old_password: old_password,
        new_password: new_password
    }));
}

function accountChangeApiKey() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            busy = false;

            var parsed = JSON.parse(this.responseText);
            $('#account-tab-api-token').val(parsed.token);
            apikey = parsed.token;
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/me/apitoken_refresh", true);
    xhttp.send();
}


function setDiscordData() {

    if($('#discord-id').val().length < 14 || $('#discord-id').val().length > 20) {
        alertify.closeLogOnClick(true).error(`Make sure you entered the correct Authorized User Id.`);
        return;
    }

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                var parsed = JSON.parse(this.responseText);
                if(parsed.success) {
                    alertify.closeLogOnClick(true).success(`Discord id set.`);
                } else {
                    alertify.closeLogOnClick(true).error(`Unable to set discord id: ${parsed.error}`);
                }
            } else if(this.status == 403) {
                alertify.closeLogOnClick(true).error(`Unable to set discord id: you need a basic or a premium plan to use the discord bot.`);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/discord/start", true);
    xhttp.send(JSON.stringify({
        id: $('#discord-id').val()
    }));
    discord_id = $('#discord-id').val();
}