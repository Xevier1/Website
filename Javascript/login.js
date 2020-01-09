function doAuthenticate() {
    var error = undefined;
    if((error = validateEmail())    != undefined ||
       (error = validatePassword()) != undefined || 
       (error = validateCaptcha())  != undefined) {
        // Error;
        console.log(error);
        return;
    }

    authenticate($('#auth-email').val(), $('#auth-password').val(), document.getElementById("g-recaptcha-response").value);
}

function validateEmail() {
    var email = $('#auth-email').val();
    if(email.length < 4) return "Email too short";
    return undefined;
}

function validatePassword() {
    var password = $('#auth-password').val();
    if(password.length > 64 || password.length < 6) return 'Password length must be between 6-64';
    return undefined;
}

function validateCaptcha() {
    var captcha = document.getElementById("g-recaptcha-response").value;
    if(!captcha) return "Please compelte the captcha.";
    return undefined;
}

function authenticate(email, password, captcha) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) grecaptcha.reset(); // If error reset recaptcha.
            alert(this.status + ": " +  this.responseText);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/authenticate", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`{ "email": "${email}", "password": "${password}", "captcha": "${captcha}" }`);
}