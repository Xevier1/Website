function doRegister() {
    var error = undefined;
    if((error = validateEmail())    != undefined ||
       (error = validateUsername()) != undefined || 
       (error = validatePassword()) != undefined || 
       (error = validateTOS())      != undefined) {
        // Error;
        console.log(error);
        return;
       }

    register($('#register-email').val(), $('#register-name').val(), $('#register-password').val());
}

function validateTOS() {
    if(!document.getElementById('register-accept-tos').checked) return "Please accept the terms of service";
    return undefined;
}

function validateEmail() {
    var email = $('#register-email').val();
    if(email.length < 4) return "Email too short";
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

function register(email, name, password) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            alert(this.status + ": " +  this.responseText);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/register", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`{ "email": "${email}", "name": "${name}", "password": "${password}" }`);
}