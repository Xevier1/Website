var busy = false;
function doRecover() {

    if(busy) return;
    busy = true;

    var error = undefined;
    if((error = validatePassword()) != undefined ||
       (error = validateParameters()) != undefined) {
        // Error;
        alertify.delay(5000).error(`Error: ` + error);
        busy = false;
        return;
    }

    reset($('#register-password').val(), getUrlParameter('email'), getUrlParameter('key'));
}

var getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function validatePassword() {
    var password = $('#register-password').val();
    var repeat = $('#register-password-repeat').val();
    
    if(password.length > 64 || password.length < 6) return 'Password length must be between 6-64';
    if(password != repeat)                          return 'Password did not match';
    return undefined;
}
function validateParameters() {
    var email = getUrlParameter('email');
    var key =  getUrlParameter('key');

    if(!email || email.length < 3) return 'Email not set, try requesting a new recovery email.';
    if(!key || key.length < 3) return 'Token not set, try requesting a new recovery email.';
    return undefined;
}

function reset(password, email, token) {
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
                alertify.delay(10000).success(`Password changed`);
                setTimeout(function(){
                    window.location.href = "/login";
                }, 500);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/reset", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        password: password,
        email: email,
        token: token
    }));
}