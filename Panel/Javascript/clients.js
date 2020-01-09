function downloadClients() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            for (var i = 0; i < parsed.clients.length; i++) addClient(parsed.clients[i]);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/clients/list", true);
    xhttp.send();
}

function addClient(data) {

    var badges = "";
    for (var i = 0; i < data.badges.length; i++) {
        badges += `<span class="client-badge client-${data.badges[i].toLowerCase()}">${data.badges[i]}</span>`
    }

    $('#client-item-holder').append(`<div class="client-item">
    <div class="client-item-title-holder">
        <div>
            <span class="client-item-title-text">${data.title}</span>${badges}<br>
            <span class="client-item-description">${data.description}</span>
        </div>
    </div>
    <div class="client-link-holder">
        <div style="text-align: center;">
            ${
                data.tutorial ? 
                `<div style="display: inline-block; margin: 6px 10px;">
                <a class="client-link-tutorial" href="${data.tutorial}" target="_blank">tutorial <i class="material-icons">launch</i></a></div>` 
                : ''
            }
            <button class="copy-button" id="account-refresh-token-button" onclick="window.open('${data.link}', '_blank');">${data.link.includes('discord') ? 'Discord' : 'Website'}</button>
        </div>
    </div>
</div>`);
}