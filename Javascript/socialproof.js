async function socialProofExec() {
    var response = await fetch('https://api.thealtening.com/socialproof/stats');
    if(response.ok) {
        let json = await response.json();
        socialProofShow(json.group, json.value);
    }
}

var groups = [
    {
        logo: 'whatshot',
        text: 'In high demand! <span class="social-proof-special-value">%special_value%</span> licenses purchased in the last 24 hours.'
    },
    {
        logo: 'people',
        text: '<span class="social-proof-special-value">%special_value%</span> people are looking at this website now!'
    }
]

function socialProofShow(groupNr, specialValue) {

    var cookieValue = getCookie('social_proof_seen');
    if(cookieValue != null && cookieValue < 3) {
        addCookie(parseInt(getCookie('social_proof_seen')) + 1);
        return;
    }

    var elementName = 'social-proof1';
    var group = groups[groupNr];

    document.body.insertAdjacentHTML('beforeend', `<div id="${elementName}" onclick="socialProofDismiss(this);" class="social-proof-container" style="display: none;">
    <div id="social-proof-shadow">
        <div id="social-proof-render">
            <table>
                <tr>
                    <td id="social-proof-logo-container"><i class="material-icons">${group.logo}</i></td>
                    <td id="social-proof-text-container"><p>${group.text.replace('%special_value%', specialValue)}</p></td>
                </tr>
            </table>
        </div>
    </div>
</div>`);

    addCookie(1);

    $('#'+elementName).fadeIn();
}


function socialProofDismiss(e) {
    $(e).fadeOut();
}

function addCookie(num) {
    var now = new Date();
    var time = now.getTime();
    var expireTime = time + 1000*86400;
    now.setTime(expireTime);
    document.cookie = 'social_proof_seen='+num+';expires='+now.toGMTString()+';path=/';
}

function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    }
    else
    {
        begin += 2;
        var end = document.cookie.indexOf(";", begin);
        if (end == -1) {
        end = dc.length;
        }
    }
    // because unescape has been deprecated, replaced with decodeURI
    //return unescape(dc.substring(begin + prefix.length, end));
    return decodeURI(dc.substring(begin + prefix.length, end));
} 