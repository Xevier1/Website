var current_tab;
var global_load = true;
var switching_tabs = false;

// Data:
var valid = false, ban = false, license_state, license, name, email, email_confirmed, reg_date, apikey, expires, discord_id;

function load_default() {
    var fragment = getFragment();
    if(fragment) switch_tab(name_to_tab(fragment.substr(1)));
    else switch_tab(name_to_tab('dashboard'));
}

function load_global() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
          handle_global_response(this.status, this.responseText);
          global_load = false;
      }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", 'https://api.thealtening.com/me/information', true);
    xhttp.send();
}
function load_global_done() {
    $('#global-loading-screen').fadeOut();
    load_default();
    
    if(!ban && license_state) {
        $('#premium_discord').show();
    }
}

function handle_global_response(code, response) {
    if(code != 200) { side_add_buttons(false); return; }
    
    var parsed = JSON.parse(response);

    // Set variables.
    valid = parsed.authenticated;
    license = parsed.license;
    license_state = parsed.license_state;
    name = parsed.name;
    email = parsed.email;
    email_confirmed = parsed.email_confirmed;
    apikey = parsed.apikey;
    ban = parsed.banned;
    reg_date = parsed.reg_date;
    expires = parsed.expires;
    discord_id = parsed.discord_id;

    // Add data.
    if(!parsed.authenticated) side_add_buttons(false);
    else side_add_buttons(true, parsed);

    // Notify.
    load_global_done();
}

function side_add_buttons(valid, data) {

    if(!valid) {
        $('#nav-category-main').append(`
            <div class="nav-items">
                <div class="nav-item">
                    <div name="button-login-noselect" onclick="open_page('/login');" class="nav-item-text-holder">
                        <i class="material-icons nav-item-text" style="margin-right: 6px;">
                            person
                        </i>
                        <span class="nav-item-text">
                            Login
                        </span>
                    </div>
                </div>
            </div>
            <div class="nav-items">
                <div class="nav-item">
                    <div name="button-register-noselect" onclick="open_page('/register');" class="nav-item-text-holder">
                        <i class="material-icons nav-item-text" style="margin-right: 6px;">
                            person_add
                        </i>
                        <span class="nav-item-text">
                            Register
                        </span>
                    </div>
                </div>
            </div>
        `);
    }
    else {
        $('#nav-category-main').append(`
            <div class="nav-items">
                <div class="nav-item">
                    <div name="/View/Account.html" onclick="switch_tab('/View/Account.html');" class="nav-item-text-holder">
                        <i class="material-icons nav-item-text" style="margin-right: 6px;">
                            person
                        </i>
                        <span class="nav-item-text">
                            ${name}
                        </span>
                    </div>
                </div>
            </div>
        `);
    }

    if(license == 'premium') {
        document.getElementById('nav-left-button-renew').style.display = "block";
    }
}

// Tabs:

var permissions = {
    "/View/Generator.html": [ "login" , "email", "ban", "premium" ],
    "/View/Authenticator.html": [ ],
    "/View/Prices.html": [ "ban" ],
    "/View/Dashboard.html": [ "email", "ban" ],
    "/View/Account.html": [ "login", "email", "ban" ],
    "/View/Api.html": [ ],
    "/View/Clients.html": [ "login", "email", "ban" ],
    "/View/Renew.html": [ "login", "email", "ban", "premium", "premium+" ],
};

function name_to_tab(name) {
    if(name == 'dashboard') return "/View/Dashboard.html";
    if(name == 'generator') return "/View/Generator.html";
    if(name == 'authenticator') return "/View/Authenticator.html";
    if(name == 'prices') return "/View/Prices.html";
    if(name == 'account') return "/View/Account.html";
    if(name == 'api') return "/View/Api.html";
    if(name == 'clients') return "/View/Clients.html";
    if(name == 'renew') return "/View/Renew.html";
}
function tab_to_name(name) {
    if(name == '/View/Dashboard.html') return "dashboard";
    if(name == '/View/Generator.html') return "generator";
    if(name == '/View/Authenticator.html') return "authenticator";
    if(name == '/View/Prices.html') return "prices";
    if(name == '/View/Account.html') return "account";
    if(name == '/View/Api.html') return "api";
    if(name == '/View/Renew.html') return "renew";
    return undefined;
}

$(window).on("popstate", function () {
    var fragment = getFragment();
    if (fragment) {
        switch_tab(name_to_tab(fragment.substr(1)));
    } else {
        switch_tab(name_to_tab('dashboard'));
    }
});  

function switch_tab(tab_name) {

    if(switching_tabs || current_tab == tab_name) return;
    if(!check_permissions(tab_name)) return;
    switching_tabs = true;

    hide_old_tab();
    $('[name="'+tab_name+'"]').addClass("selected");
    load_show();

    try {
        if(tab_to_name(tab_name)) {
            history.pushState("", "", '#' + tab_to_name(tab_name));
            ga('send', 'pageview', '#' + tab_name);
        }
    }
    catch(ex) {}

    downloadNewPage(tab_name, function(code, res) {
        load_hide();
        show_page(res);
        current_tab = tab_name;
        switching_tabs = false;
    });
}

function check_permissions(tab_name) {

    var permission = permissions[tab_name];
    if(!permission) return true;

    if(permission.indexOf("login") != -1) {
        if(!valid) {
            window.location.href = "/login"; // Redirect to login.
            return false;
        }
    }
    if(permission.indexOf("ban") != -1) {
        if(ban) {
            switch_tab("/View/Account.html"); // Redirect to account page.
            return false;
        }
    }
    if(permission.indexOf("email") != -1) {
        if(valid && !email_confirmed) {
            window.location.href = "/email?email=" + email; // Redirect to login.
            return false;
        }
    }
    if(permission.indexOf("premium") != -1) {
        if(!license_state) {
            switch_tab("/View/Prices.html"); // Redirect to prices.
            return false;
        }
    }
    if(permission.indexOf("premium") != -1) {
        if(!license_state) {
            switch_tab("/View/Prices.html"); // Redirect to prices.
            return false;
        }
    }
    if(permission.indexOf("premium+") != -1) {
        if(license != 'premium') {
            switch_tab("/View/Prices.html"); // Redirect to prices.
            return false;
        }
    }
    
    return true;
}

function show_page(data) {
    $('#displayed-data').html(data);
}

function hide_old_tab() {
    if(!current_tab) return;
    
    $('[name="'+current_tab+'"]').removeClass("selected");
    $('#displayed-data').html('');
}

var load_showing = false;
function load_show() {
    if(load_showing) return;
    load_showing = true;

    $('#loading-screen').fadeIn();
}
function load_hide() {
    if(!load_showing) return;
    load_showing = false;

    $('#loading-screen').fadeOut();
}

function downloadNewPage(page, response) {

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        response(this.status, this.responseText);
      }
    };
    xhttp.open("GET", page, true);
    xhttp.send();
}

function logout() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        window.location.href = "/";
      }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/me/logout", true);
    xhttp.send();
}

// Utilit:
var getFragment = function() {
    return window.location.hash;
}
var getParameter = function(sParam) {
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