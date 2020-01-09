var busy = false;

function doRegister(token) {
    
    if(busy) return;
    busy = true;

    var error = undefined;
    if((error = validateEmail())    != undefined ||
       (error = validateUsername()) != undefined || 
       (error = validatePassword()) != undefined ||
       (error = validateCaptcha(token) != undefined)) {
        // Error;
        alertify.delay(5000).error(`Error: ` + error);
        busy = false;
        return;
       }

    register($('#register-email').val(), $('#register-name').val(), $('#register-password').val(), token);
}

function validateTOS() { // Not used here.
    if(!document.getElementById('register-accept-tos').checked) return "Please accept the terms of service";
    return undefined;
}

function validateEmail() {
    var email = $('#register-email').val();
    if(email.length < 4) return "Email too short";
    if(!email.includes("@")) return "Email is invalid";
    if(!email.includes(".")) return "Email is invalid";
    
    return undefined;
}

function validateCaptcha(token) {

    if(!token || token.length < 3) return "Please complete the captcha";

    return undefined;
}

function validateUsername() {
    var username = $('#register-name').val();
    if(username.length > 32 || username.length < 4) return "User length must be between 4-32";
    if(!/^\w+$/.test(username))                     return "Username cannot contain any special characters";
    return undefined;
}

function validatePassword() {
    var password = $('#register-password').val();
    var repeat = $('#register-password-repeat').val();
    
    if(password.length > 64 || password.length < 6) return 'Password length must be between 6-64';
    if(password != repeat)                          return 'Password did not match';
    return undefined;
}

function register(email, name, password, token) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) {
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(5000).error(`Error: ` + parsed.errorMessage);
                }catch(ex) {alertify.delay(5000).error(`Error: server error occured, try again later.`);}
                busy = false;
            } else {
                alertify.success(`Account registered, redirecting...`);
                setTimeout(function(){
                    window.location.href = "/email?email=" + email;
                }, 500);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/register", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        email: email,
        name: name,
        password: password,
        captcha: token
    }));
}