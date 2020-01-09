var busy = false;
function doResendEmail() {

    if(busy) return;
    busy = true;

    resendEmail();
}

function resendEmail() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) {
                alertify.delay(5000).error(`Error: could not send email (Contact support if this persists)`);
                busy = false;
            } else {

                var parsed = JSON.parse(this.responseText);
                if(!parsed.done) {
                    alertify.success(`Email re-sent, please check your inbox.`);
                    busy = false;
                }else {
                    window.location.href = "/";
                }
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/me/emailresend", true);
    xhttp.send();
}