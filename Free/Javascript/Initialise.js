var processing = false;
function Init() {

    if(processing) return;
    processing = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                var parsed = JSON.parse(this.responseText);
                var redirectTime = 5;
                setTimeout(function(){
                    processing = false;
                    window.location.href = parsed.redirect;
                }, redirectTime*1000);

                document.getElementById("redirect-text").style.display = "block";
                var count = 0;
                setInterval(function() {
                    if(redirectTime-count > 0) {
                        document.getElementById("redirect-text").innerText = "You will be redirected in "+(redirectTime-count)+" seconds...";
                        count++;
                    } else {
                        document.getElementById("redirect-text").innerText = "Redirecting...";
                    }
                }, 1000);
            } else {

                if(this.status == 400) {
                    var parsed = JSON.parse(this.responseText);
                    if(parsed.error == 'limit_reached') {
                        document.getElementById("limit-overlay").style.display = "block";
                        return;
                    }
                }

                processing = false;
                alert('Error, try again later.');
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/free/initialise", true);
    xhttp.send(JSON.stringify({
        captcha: grecaptcha.getResponse()
    }));
}

function ShowCaptcha() {
    document.getElementById("captcha-overlay").style.display = "block";
}

function CaptchaCallback () {
    Init();
    document.getElementById("captcha-overlay").style.display = "block";
}

function HideOverlay() {
    if(!processing) document.getElementById("captcha-overlay").style.display = "none";
}