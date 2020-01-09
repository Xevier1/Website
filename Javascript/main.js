// High level.
function doGenerate() {
    generate(function (code, parsed) {
        if (code == 200) {
            $('#generate-token').text(parsed.token);
            $('#generate-expires').text(parsed.expires);
            $('#generate-limit').text(parsed.limit);
        } else alert('Alert: ' + parsed.errorMessage);
    });
}

function doHistory() {
    history(function (code, parsed) {
        if (code == 200) {
            var v = "";
            parsed.forEach(element => {
                // has element.expires as well
                v += element.token + " :: ";
            });
            $('#history-tokens').text(v);
        } else alert('Alert: ' + parsed.errorMessage);
    });
}


// Low level.
function generate(response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            response(this.status, parsed);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/generate", true);
    xhttp.send(null);
}

function information(token, response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            response(this.status, parsed);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/me/information", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`{ "token": "${token}" }`);
}

function history(response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            response(this.status, parsed);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/history", true);
    xhttp.send(null);
}