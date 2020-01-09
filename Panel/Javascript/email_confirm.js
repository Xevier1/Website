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

doSendConfirm(); // Auto send.
function doSendConfirm() {

    sendConfirm(getUrlParameter('key'));
}

function sendConfirm(key) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status != 200) {
                alertify.delay(5000).error(`Error: could not confirm email, try again.`);
                setTimeout(function(){
                    window.location.href = "/email?email=" + getUrlParameter('email');
                }, 2000);
            } else {
                setTimeout(function() { 
                    window.location.href = "/";
                }, 1000);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/emailconfirm", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        key: key       
    }));
}