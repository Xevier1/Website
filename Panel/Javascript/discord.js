function loadDiscordData() {

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                var parsed = JSON.parse(this.responseText);
                $('#discord-bot-status').text('Bot Status: ' + parsed.status);
                $('#discord-bot').val(parsed.bot);
                $('#discord-id').val(parsed.id);
            } else {
                $('#discord-bot-status').text('Bot Status: Offline');
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/discord/load", true);
    xhttp.send();
}

function setDiscordData() {

    if($('#discord-bot').val().length < 50 || $('#discord-bot').val().length > 64) {
        alertify.closeLogOnClick(true).error(`Make sure you entered the correct Bot Token.`);
        return;
    }
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
                    $('#discord-bot-status').text('Bot Status: Online (or soon to be)');
                    alertify.closeLogOnClick(true).success(`Starting discord bot.`);
                } else {
                    alertify.closeLogOnClick(true).error(`Unable to start discord bot: ${parsed.error}`);
                }
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/discord/start", true);
    xhttp.send(JSON.stringify({
        bot: $('#discord-bot').val(),
        id: $('#discord-id').val()
    }));
}

function stopDiscordBot() {

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                $('#discord-bot-status').text('Bot Status: Offline');
                alertify.closeLogOnClick(true).success(`Stopping discord bot.`);
            } else {
                alertify.closeLogOnClick(true).error(`Unable to stop discord bot, try again later.`);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/discord/stop", true);
    xhttp.send();
}