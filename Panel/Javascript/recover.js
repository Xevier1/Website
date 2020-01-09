var busy = false;
var success = false;
function doRecover() {

    if(busy) {
        if(success) alertify.delay(2000).success(`Email has already been sent.<br>(The email can take up to a few minutes to arrive)`);
        return;
    }
    busy = true;

    var error = undefined;
    if((error = validateEmail())    != undefined || 
       (error = validateCaptcha())  != undefined) {
        // Error;
        alertify.delay(5000).error(`Error: ` + error);
        busy = false;
        return;
    }

    recover($('#auth-email').val(), document.getElementById("g-recaptcha-response").value);
}

function validateEmail() {
    var email = $('#auth-email').val();
    if(email.length < 4) return "Email too short";
    return undefined;
}

function validateCaptcha() {
    var captcha = document.getElementById("g-recaptcha-response").value;
    if(!captcha) return "Please compelte the captcha.";
    return undefined;
}

function recover(email, captcha) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) {
                grecaptcha.reset(); // If error reset recaptcha.
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(5000).error(`Error: ` + parsed.errorMessage);
                }catch(ex) {alertify.delay(5000).error(`Error: server error occured, try again later.`);}
                busy = false;
            } else {
                success = true;
                alertify.delay(10000).success(`Email sent.<br>(The email can take up to a few minutes to arrive)`);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/recover", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        email: email,
        captcha: captcha
    }));
}