var hasDelay = false;
function Delay() {
    hasDelay = true;
    setTimeout(function() {
        hasDelay = false;
    }, 10000);
}

function Generate() {

    if(hasDelay) {
        alertify.delay(2500).error(`Please wait 10 seconds between generating accounts.`);
        return;
    }

    hasDelay = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            handleResponse(this.status, this.responseText);
            Delay();
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/free/generate", true);
    xhttp.send();
}

function handleResponse(status, data) {

    if(status == 200) {
        var parsed = JSON.parse(data);
        // Set generator.
        $('#generator_username').val(parsed.username);
        $('#generator_token').val(parsed.token);

        // Set display.
        $('#generator_display_username').text(parsed.username);
        $('#generator-display-body').attr("src", "https://cdn.thealtening.com/skins/body/" + parsed.skin +".png");
        $('#details-button-holder').css("display", 'block');

        countdown(15);

    } else if(status == 403) {
        var parsed = JSON.parse(data);
        if(parsed.error == 'limit_reached') {
            document.getElementById("limit-overlay").style.display = "block";
            return;
        } 
    } else {
        $('#gen-panel').addClass('animated fadeOutUp fast');

        try {
            var parsed = JSON.parse(data);
            if(parsed.error) {
                $('#error-text').text(parsed.error);
            } else {
                window.location.replace("/free/free-minecraft-alts");
            }
        }catch (e) { window.location.replace("/free/free-minecraft-alts"); }

        setTimeout(function() {
            $('#gen-panel').css("display", "none");
            $('#err-panel').css("display", "block");
        }, 1000);

    }
}

function generatorCopyTokenDetails(mode, id) {

    try {
        if(mode == 'token') clipboard.writeText($('#generator_token').val());
        if(mode == 'name') clipboard.writeText($('#generator_username').val());
        if(mode == 'all') clipboard.writeText($('#generator_token').val() + ":anything");
    
        $('#' + id).text("Copied!");
        setTimeout(function(){
            $('#' + id).text("Copy");
        }, 1250);
    } catch(ex) { 
        $('#' + id).text("Error!");
        setTimeout(function(){
            $('#' + id).text("Copy");
        }, 1250);
    }
}

var countdownInterval;
function countdown(max) {
    var cur = 0;
    $('#expires-in').text('Expires in 15 minutes');
    if(countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function(){
        cur++;
        if(max-cur > 0) $('#expires-in').text('Expires in '+(max-cur)+' minutes');
        else $('#expires-in').text('Token expired');
    }, 60000)
}