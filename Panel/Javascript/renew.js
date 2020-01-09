function doTokenExtension(token) {
    
    if(busy) return;
    busy = true;

    var error = undefined;
    if((error = validateExtendToken()) != undefined ||
       (error = validateCaptcha(token) != undefined)) {
        // Error;
        alertify.delay(5000).error(`Error: ` + error);
        busy = false;
        return;
    }

    tokenExtension($('#extend-token-input').val(), token);
}

function validateExtendToken() {
    var token = $('#extend-token-input').val();
    if(token.length < 4) return "Token is invalid";
    if(!token.includes("@")) return "Token is invalid";
    if(!token.includes(".")) return "Token is invalid";
    
    return undefined;
}
function validateCaptcha(token) {

    if(!token || token.length < 3) return "Please complete the captcha";

    return undefined;
}

function tokenExtension(alt, token) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 204) {
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(5000).error(`Error: ` + parsed.errorMessage);
                }catch(ex) {alertify.delay(5000).error(`Error: server error occured, try again later.`);}
            } else {
                alertify.success(`✔ Account extended for 7 more days.`);
            }
            grecaptcha.reset();
            busy = false;
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/alts/renew", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        token: alt,
        captcha: token
    }));
}