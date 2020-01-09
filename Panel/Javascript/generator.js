var historyCount = 8;
var favoriteCount = 10;
var privateCount = 10;
var generating = false;
var apiResetTime = 0;

var currentToken;

// On load:
function generateReset() {
    generating = false;
    generatorHistoryItems = [];
    generatorFavoriteItems = [];
    generatorPrivateItems = [];
}
function generateInit() {

    if(license === 'premium') historyCount = 12;

    donwloadGenStats();
    doHistory();
    favoritesHistory();
    privatesHistory();
}

// Api update:
function updateApiResetTime() {

    if(apiResetTime && !apiResetTime.reset) {
        apiResetTime.seconds--;
        if(apiResetTime.seconds < 0) {
            apiResetTime.seconds = 59;
            apiResetTime.minutes--;
        }
        if(apiResetTime.minutes < 0) {
            apiResetTime.minutes = 59;
            apiResetTime.hours--;
        }

        if(apiResetTime.hours < 0) {
            apiResetTime.reset = true;
        }

        var stamp = '';
        if(apiResetTime.reset) {
            stamp = "API Reset";
        } else {
            stamp = "API Resets In " + (('0'+apiResetTime.hours).slice(-2)+':'+('0'+apiResetTime.minutes).slice(-2)+':'+('0'+apiResetTime.seconds).slice(-2));
        }

        $('#api-reset-timer').text(stamp);
    }

}
function doTimeOut() {
    setInterval(function() {
        updateApiResetTime();
    }, 1000);
}

function onRenewClicked() {
    if(license !== 'premium') {
        alertify.error("You need Premium to be able to renew tokens! <a href='#' class='notifylink' onclick='switch_tab(`/View/Prices.html`)'>Click here to upgrade.</a>");
    } else {
        var win = window.open('https://panel.thealtening.com/#renew', '_blank');
        win.focus();
    }
}

// Generator:
function doGenerate() {
    if(generating) return;
    generating = true;

    generate(function(code, parsed){
        if(code == 200) {
            generatorAddAccount(parsed.username, parsed.token, parsed.skin, parsed.cape, false, true, parsed.info);
            if(parsed.captcha_next) {
                renderCaptcha();
            }
        } else {
            alert('Error: ' + parsed.errorMessage);
            if(parsed.errorMessage.indexOf('Captcha invalid') != -1) {
                renderCaptcha();
            }
        }
        generating = false;
    });
}
function generate(response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            hideCaptcha(); // Hide the capthca, in case we shown it.
            var parsed = JSON.parse(xhttp.responseText);
            response(this.status, parsed);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/alts/generate", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    
    var captchaAnswer = getCaptchaValue();
    if(captchaAnswer.length == 0) {
        alertify.delay(2500).error(`Please complete the captcha before attempting to generating an alt.`);
        generating = false;
        return;
    }

    xhttp.send(JSON.stringify({
        captcha: captchaAnswer
    }));
}

function getCaptchaValue() {
    try{
        return grecaptcha.getResponse();
    } catch(ex) {
        return "-1";
    }
}

function doHistory() {
    _history(function(code, parsed){
        if(code == 200) {
            apiResetTime = parsed.shift().api_reset;
            var is_captcha = parsed.shift().is_captcha;
            if(is_captcha) {
                renderCaptcha();
            }
            updateApiResetTime();
            doTimeOut();

            parsed.reverse().forEach(element => {
                generatorAddToHistory(element.token, element.name, element.skin, element.cape, element.valid, undefined, element.info);
            });

            // Display first.
            if(parsed.length > 0) {
                var element = parsed.reverse()[0];
                if(!element.expired) generatorAddAccount(element.name, element.token, element.skin, element.cape, element.valid, undefined, element.info);
            }

        } else alert('Error: ' + parsed.errorMessage);
    });
}
function _history(response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            response(this.status, parsed);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/history", true);
    xhttp.send(null);
}

function doAddFavorite(token, add) {

    if(license != "premium") {
        alertify.error("You need Premium to favorite an account! <a href='#' class='notifylink' onclick='switch_tab(`/View/Prices.html`)'>Click here to upgrade.</a>");
        return;
    }

    if(generating) return;
    generating = true;

    addFavorite(token, add, function(code, parsed){
        if(code == 200) {
            parsed = JSON.parse(parsed);

            if(add) {
                generatorAddToFavorite(parsed.token, parsed.name, parsed.skin, parsed.cape, parsed.valid, true, parsed.info);
                alertify.closeLogOnClick(true).success(`Account <i>${parsed.name}</i> added to favorites.`);
            } else {
                generatorRemoveFromFavorite(parsed.token);
                alertify.closeLogOnClick(true).success(`Account <i>${parsed.name}</i> removed from favorites.`);    
            }
        } else if(code == 204) {
            alertify.delay(4000).error(`Account already in favorite list.`);
        } else {
            parsed = JSON.parse(parsed);
            alertify.delay(4000).error(`Could not add account to favorites. Details:<br>` + parsed.errorMessage);
        }
        generating = false;

    });
}
function addFavorite(token, add, response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            response(this.status, this.responseText);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/alts/favorite", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        token: token,
        add: add
    }));
}
function favoritesHistory() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            var code = this.status;
            if(code == 200) {
                if(Object.keys(parsed).length === 0) return; // No favorites.
                parsed.forEach(element => {
                    generatorAddToFavorite(element.token, element.name, element.skin, element.cape, element.valid, undefined, element.info);
                });
            } else alertify.delay(4000).error(`Could not add account to favorites. Details:<br>` + parsed.errorMessage);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/favorites", true);
    xhttp.send(null);
}

function doAddPrivate(token, add) {

    if(license != "premium") {
        alertify.error("You need Premium to private an account! <a href='#' class='notifylink' onclick='switch_tab(`/View/Prices.html`)'>Click here to upgrade.</a>");
        return;
    }

    if(generating) return;
    generating = true;

    addPrivate(token, add, function(code, parsed){
        if(code == 200) {
            parsed = JSON.parse(parsed);

            if(add) {
                generatorAddToPrivate(parsed.token, parsed.name, parsed.skin, parsed.cape, parsed.valid, true, parsed.info);
                alertify.closeLogOnClick(true).success(`Account <i>${parsed.name}</i> added to privates.`);
            }else {
                generatorRemoveFromPrivate(parsed.token);
                alertify.closeLogOnClick(true).success(`Account <i>${parsed.name}</i> removed from privates.`);
            }
        } else if(code == 204) {
            alertify.delay(4000).error(`Account already in private list.`);
        } else {
            parsed = JSON.parse(parsed);
            alertify.delay(4000).error(`Could not add account to privates. Details:<br>` + parsed.errorMessage);
        }
        generating = false;
    });
}
function addPrivate(token, add, response) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            response(this.status, this.responseText);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/alts/private", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        token: token,
        add: add
    }));
}
function privatesHistory() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            var code = this.status;
            if(code == 200) {
                if(Object.keys(parsed).length === 0) return; // No favorites.
                parsed.forEach(element => {
                    generatorAddToPrivate(element.token, element.name, element.skin, element.cape, element.valid, undefined, element.info);
                });
            } else alertify.delay(4000).error(`Could not add account to privates. Details:<br>` + parsed.errorMessage);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/privates", true);
    xhttp.send(null);
}

function donwloadGenStats() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            var code = this.status;
            if(code == 200) {
                $('#gen-stats-lifetime').text(parsed.lifetime);
                $('#gen-stats-month').text(parsed.month);
                $('#gen-stats-week').text(parsed.week);
                $('#gen-stats-day').text(parsed.day);
            } else alertify.delay(4000).error(`Could not load alt stats. Details:<br>` + parsed.errorMessage);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/alts/stats", true);
    xhttp.send(null);
}

function isEmptyObject(obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }

function objectSize(obj) {
    var i = 0;
    for (var key in obj) {
      i++
    }
    return i;
  }

function datediff(first, second) {
    // Take the difference between the dates and divide by milliseconds per day.
    // Round to nearest whole number to deal with DST.
    return {
        days: Math.round((second-first)/(1000*60*60*24)),
        hours: Math.round((second-first)/(1000*60*60)),
        minutes: Math.round((second-first)/(1000*60))
    } 
}

// GUI:
function generatorAddAccount(username, token, skin, cape, ignoreHistory, inc, info) {

    currentToken = token;

    // Set generator.
    $('#generator_username').val(username);
    $('#generator_token').val(token);

    // Set display.
    $('#generator_display_username').text(username);
    $('#generator-display-body').attr("src", "https://cdn.thealtening.com/skins/body/" + skin +".png");
    $('#details-button-holder').css("display", 'block');

    // Set buttons.
    $('#details-fav-button').off('click');
    $('#details-fav-button').on('click', function(){doAddFavorite(token, true);});
    $('#details-priv-button').off('click');
    $('#details-priv-button').on('click', function(){doAddPrivate(token, true);});

    if (typeof info == "string") info = JSON.parse(decodeURIComponent(info));
    
    revealInfoBox(info);
    if(license == 'premium' || license == 'platinum') revealBanBox(token);
    if(license == 'premium' || license == 'platinum') setBanQueueState('none');

    // Set premium buttons. Depricated, capes moved to info.
    //if(cape != "[premium]")  $('#cape-display-text').text((!cape || cape == "none") ? "No Capes" : "Optifine Cape");
    //else $('#cape-display-text').text("Capes");
    
    $('#alt-expired-container').css('display', 'none');
    $('#alt-expires-container').css('display', 'none');
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = true;//
            var parsedData;
            try {
                parsedData = JSON.parse(this.responseText);
            } catch (e) { parsed = false; }

            if(this.status == 200 && parsed) {
                if(currentToken == parsedData.token) {
                    if(parsedData.expired === true) {
                        $('#alt-expires-container').css('display', 'none');
                        $('#alt-expired-container').css('display', 'inline-block');
                    } else {

                        // Set new time.
                        var expiresDate = new Date(parsedData.expires);
                        var expiresCheckInterval = setInterval(function() {
                            if(currentToken != parsedData.token) {
                                clearInterval(expiresCheckInterval);
                                return;
                            } else {
                                var timeDifferenceText = 'in ';
                                var timeDifferenceValue = datediff(Date.now(), expiresDate);
                                if (timeDifferenceValue.days > 0) {
                                    timeDifferenceText += timeDifferenceValue.days + ` Day${timeDifferenceValue.days > 1 ? 's' : ''}` 
                                } else if (timeDifferenceValue.hours > 0) {
                                    timeDifferenceText += timeDifferenceValue.hours + ` Hour${timeDifferenceValue.hours > 1 ? 's' : ''}` 
                                } else if(timeDifferenceValue.minutes > 0) {
                                    timeDifferenceText += timeDifferenceValue.minutes + ` Minute${timeDifferenceValue.minutes > 1 ? 's' : ''}` 
                                } else {
                                    $('#alt-expires-container').css('display', 'none');
                                    $('#alt-expired-container').css('display', 'inline-block');
                                    clearInterval(expiresCheckInterval);
                                    return;
                                }

                                $('#alt-expires-timer-text').text(timeDifferenceText);
                            }
                        }, 500);

                        setTimeout(function() {
                            $('#alt-expired-container').css('display', 'none');
                            $('#alt-expires-container').css('display', 'inline-block');
                        }, 500);
                    }
                }
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/alts/expirationinformation", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        token: token
    }));

    // 
    if (info && !isEmptyObject(info)) {
        $('#cape-display-text').css('color', '#32ccaa');
        $('#cape-display-text').css('cursor', 'pointer');
        $('#cape-display-text-attention').text(objectSize(info));
        $('#cape-display-text-attention').css('display', 'inline');

        var special = false;
        if(info['hypixel.rank'] || info['mineplex.rank'] || (cape && cape != "[premium]" && cape != "none")) special = true;
        

        if(special) $('#cape-display-text-attention').addClass('pulse');
        else $('#cape-display-text-attention').removeClass('pulse');

        $('#cape-display-button').unbind('click');
        $("#cape-display-button").on("click", function(){ revealInfoBox(info, true); });
    } else {
        $('#cape-display-text').css('color', '#32ccaa8c');
        $('#cape-display-text').css('cursor', 'default');
        $('#cape-display-text-attention').css('display', 'none');

        $('#cape-display-button').unbind('click');
    }

    $('#bans-display-text').unbind('click');
    $("#bans-display-text").on("click", function(){ revealBanBox(token, true); })

    if(inc) {
        $('#gen-stats-day').text(parseInt($('#gen-stats-day').text()) + 1);
        $('#gen-stats-week').text(parseInt($('#gen-stats-week').text()) + 1);
        $('#gen-stats-month').text(parseInt($('#gen-stats-month').text()) + 1);
        $('#gen-stats-lifetime').text(parseInt($('#gen-stats-lifetime').text()) + 1);
    }

    if(!ignoreHistory) generatorAddToHistory(token, username, skin, cape, true, true, info);
    if(license == 'starter') $("#cape-display-button").on("click", function(){ revealInfoBox(info, true); }); // Always inform the user that starter can't view info.
}

function generatorCopyTokenDetails(mode, id) {

    try {
        if(mode == 'token') clipboard.writeText($('#generator_token').val());
        if(mode == 'name') clipboard.writeText($('#generator_username').val());
        if(mode == 'all') clipboard.writeText($('#generator_token').val() + ":anything");
    
        $('#' + id).text("Copied!");
        setTimeout(function(){
            $('#' + id).text("Copy");
        }, 1250);
    } catch(ex) { 
        $('#' + id).text("Error!");
        setTimeout(function(){
            $('#' + id).text("Copy");
        }, 1250);
    }
}

var generatorHistoryItems = [];
function generatorAddToHistory(token, username, skin, cape, valid, animate, info) {
    var tokenRaw = encodeURI(token);
    var usernameRaw = username;
    token = "hist-" + token.replace('@', '').replace('.', '').replace('-', ''); // Fix invalid characters.
    if(generatorHistoryItems.length >= historyCount) {
        // Delete last one.
        var last = generatorHistoryItems.shift();
        $('#' + last).addClass('animated fadeOutRight');
        setTimeout(function() {
            try{
                var element = document.getElementById(last);
                element.parentElement.removeChild(element);
            }catch(ex) {
                // Has not been created yet.
                setTimeout(function(){
                    var element = document.getElementById(last);
                    element.parentElement.removeChild(element);
                }, 1000);
            }
        }, 400);
    }
    generatorHistoryItems.push(token);

    var cssAdd = "";
    var imgAdd = "";
    var roundAdd = "";
    if(animate) cssAdd = " animated fadeInLeft";

    // Add valid modyfier.
    if(!valid) username = `<i class="broken-text">${username} (broken)</i>`;
    if(!valid) imgAdd = " broken-img";
    if(!valid) roundAdd = " broken-round";


    setTimeout(function(){
        $('#window-history-holder').html( 
            '<div id='+ (token) +' class="history-object'+cssAdd+'">\
            <img src="'+("https://cdn.thealtening.com/skins/face/" + skin +".png")+'" width="16px" class="img-shadow'+imgAdd+'" style="vertical-align: bottom;" alt="minecraft-alts-face">\
            <span>'+username+'</span>\
            <i onclick="generatorAddAccount(\''+usernameRaw+'\', \''+tokenRaw+'\', \''+skin+'\', \''+cape+'\', true, undefined, \''+encodeURIComponent(JSON.stringify(info))+'\');" class="material-icons highlighted-round-icon'+roundAdd+'" style=" vertical-align: bottom;">visibility</i><i ' + (valid?'onclick="doAddFavorite(\''+tokenRaw+'\', true);"':'')+ ' class="material-icons highlighted-round-icon'+roundAdd+'" style=" vertical-align: bottom;">favorite</i><i '+ (valid?'onclick="doAddPrivate(\''+tokenRaw+'\', true);"' : '')+ ' class="material-icons highlighted-round-icon'+roundAdd+'" style="vertical-align: bottom;">lock</i>\
            </div>'
            + $('#window-history-holder').html()
        );
        setTimeout(function(){
            $('#' + token).removeClass('animated fadeInLeft');
        }, 750);
    }, 550);
}

var generatorFavoriteItems = [];
function generatorAddToFavorite(token, username, skin, cape, valid, animate, info) {
    var tokenRaw = encodeURI(token);
    var usernameRaw = username;
    token = "fav-" + token.replace('@', '').replace('.', '').replace('-', ''); // Fix invalid characters.
    if(generatorFavoriteItems.length >= favoriteCount) {
        // Delete last one.
        var last = generatorFavoriteItems.shift();
        $('#' + last).addClass('animated fadeOutDown');
        setTimeout(function() {
            try{
                var element = document.getElementById(last);
                element.parentElement.removeChild(element);
            }catch(ex) {
                // Has not been created yet.
                setTimeout(function(){
                    var element = document.getElementById(last);
                    element.parentElement.removeChild(element);
                }, 1000);
            }
        }, 400);
    }
    generatorFavoriteItems.push(token);

    var imgAdd = "";
    var cssAdd = "";
    if(animate) cssAdd = " animated fadeInDown";

    $('#favorite-holder-count').text(generatorFavoriteItems.length + "/" + favoriteCount + " Accounts");

    // Add valid modyfier.
    if(!valid) username = `<i class="broken-text">${username} (broken)</i>`;
    if(!valid) imgAdd = " broken-img";

    setTimeout(function(){
        $('#favorite-holder').html( 
            `<div id="${token}" class="account-object${cssAdd}">
            <img src="${"https://cdn.thealtening.com/skins/face/" + skin +".png"}" width="16px" class="img-shadow${imgAdd}" style="vertical-align: bottom;" alt="minecraft-alts-face">
            <span>${username}</span>

            <div class="image-holder">
                <i onclick="generatorAddAccount('${usernameRaw}', '${tokenRaw}', '${skin}', '${cape}', true, undefined, ${'\''+encodeURIComponent(JSON.stringify(info))+'\''});" class="material-icons highlighted-round-icon" style=" vertical-align: bottom;">visibility</i><i onclick="doAddPrivate('${tokenRaw}', true);" class="material-icons highlighted-round-icon" style="vertical-align: bottom;">lock</i><i onclick="doAddFavorite('${tokenRaw}', false);" class="material-icons highlighted-round-icon" style="vertical-align: bottom;">favorite_outline</i>
            </div>
            </div>`
            + $('#favorite-holder').html()
        );
        setTimeout(function(){
            $('#' + token).removeClass('animated fadeInDown');
        }, 750);
    }, 550);
}
function generatorRemoveFromFavorite(token) {
    token = "fav-" + token.replace('@', '').replace('.', '').replace('-', ''); // Fix invalid characters.

    var temp = [];
    for(var i = 0; i < generatorFavoriteItems.length; i++)
        if(generatorFavoriteItems[i] != token)
            temp.push(generatorFavoriteItems[i]);
    generatorFavoriteItems = temp;
    $('#favorite-holder-count').text(generatorFavoriteItems.length + "/" + favoriteCount + " Accounts");

    $('#' + token).addClass('animated fadeOutLeft');
    setTimeout(function() {
        try{
            var element = document.getElementById(token);
            element.parentElement.removeChild(element);
        }catch(ex) {
            // Has not been created yet.
            setTimeout(function(){
                var element = document.getElementById(token);
                element.parentElement.removeChild(element);
            }, 1000);
        }
    }, 400);
}

var generatorPrivateItems = [];
function generatorAddToPrivate(token, username, skin, cape, valid, animate, info) {
    var tokenRaw = encodeURI(token);
    var usernameRaw = username;
    token = "priv-" + token.replace('@', '').replace('.', '').replace('-', ''); // Fix invalid characters.
    if(generatorPrivateItems.length >= privateCount) {
        // Delete last one.
        var last = generatorPrivateItems.shift();
        $('#' + last).addClass('animated fadeOutDown');
        setTimeout(function() {
            try{
                var element = document.getElementById(last);
                element.parentElement.removeChild(element);
            }catch(ex) {
                // Has not been created yet.
                setTimeout(function(){
                    var element = document.getElementById(last);
                    element.parentElement.removeChild(element);
                }, 1000);
            }
        }, 400);
    }
    generatorPrivateItems.push(token);

    var imgAdd = "";
    var cssAdd = "";
    if(animate) cssAdd = " animated fadeInDown";

    $('#private-holder-count').text(generatorPrivateItems.length + "/" + privateCount + " Accounts");

    // Add valid modyfier.
    if(!valid) username = `<i class="broken-text">${username} (broken)</i>`;
    if(!valid) imgAdd = " broken-img";

    setTimeout(function(){
        $('#private-holder').html( 
            `<div id="${token}" class="account-object${cssAdd}">
            <img src="${"https://cdn.thealtening.com/skins/face/" + skin +".png"}" width="16px" class="img-shadow${imgAdd}" style="vertical-align: bottom;" alt="minecraft-alts-face">
            <span>${username}</span>

            <div class="image-holder">
                <i onclick="generatorAddAccount('${usernameRaw}', '${tokenRaw}', '${skin}', '${cape}', true, undefined, ${'\''+encodeURIComponent(JSON.stringify(info))+'\''});" class="material-icons highlighted-round-icon" style=" vertical-align: bottom;">visibility</i><i onclick="doAddFavorite('${tokenRaw}', true);" class="material-icons highlighted-round-icon" style=" vertical-align: bottom;">favorite</i><i onclick="doAddPrivate('${tokenRaw}', false);" class="material-icons highlighted-round-icon" style="vertical-align: bottom;">lock_outline</i>
            </div>
            </div>`
            + $('#private-holder').html()
        );
        setTimeout(function(){
            $('#' + token).removeClass('animated fadeInDown');
        }, 750);
    }, 550);
}
function generatorRemoveFromPrivate(token) {
    token = "priv-" + token.replace('@', '').replace('.', '').replace('-', ''); // Fix invalid characters.
    
    var temp = [];
    for(var i = 0; i < generatorPrivateItems.length; i++)
        if(generatorPrivateItems[i] != token)
            temp.push(generatorPrivateItems[i]);
    generatorPrivateItems = temp;
    $('#private-holder-count').text(generatorPrivateItems.length + "/" + privateCount + " Accounts");

    $('#' + token).addClass('animated fadeOutLeft');
    setTimeout(function() {
        try{
            var element = document.getElementById(token);
            element.parentElement.removeChild(element);
        }catch(ex) {
            // Has not been created yet.
            setTimeout(function(){
                var element = document.getElementById(token);
                element.parentElement.removeChild(element);
            }, 1000);
        }
    }, 400);
}

var isInfoBoxRevealed = false;
function revealInfoBox(info, isRequest) {

    if(isRequest) isInfoBoxRevealed = !isInfoBoxRevealed; // toggle

    if(isInfoBoxRevealed && license != "premium" && license != 'basic') {
        alertify.error("You need either Basic or Premium to view the alt's info! <a href='#' class='notifylink' onclick='switch_tab(`/View/Prices.html`)'>Click here to upgrade.</a>");
        return;
    }

    var addInfoBox = function(item) {
        if (item.text1 || item.text2) $('#window-info').append("<div class='window-info-box'><span class='window-info-header'>"+item.header+"</span><span class='window-info-text'>"+(item.text1==undefined?'':item.text1)+"</span><span class='window-info-text'>"+(item.text2==undefined?'':item.text2)+"</span></div>");
    }

    if(isInfoBoxRevealed) {

        $('#window-info').html('');

        addInfoBox({
            header: 'Hypixel',
            text1: info['hypixel.rank']==undefined?undefined:info['hypixel.rank']+' Rank',
            text2: info['hypixel.lvl']==undefined?undefined:'Level '+info['hypixel.lvl'],
        })
        addInfoBox({
            header: 'Mineplex',
            text1: info['mineplex.rank']==undefined?undefined:info['mineplex.rank']+' Rank',
            text2: info['mineplex.lvl']==undefined?undefined:'Level '+info['mineplex.lvl'],
        })
        addInfoBox({
            header: '5Zig',
            text1: info['5zig.cape']==undefined?undefined:'Cape',
            text2: undefined
        })
        addInfoBox({
            header: 'LabyMod',
            text1: info['labymod.cape']==undefined?undefined:'Cape',
            text2: undefined
        })
    }

    if(isRequest) 
        if(isInfoBoxRevealed) $('#window-info').slideDown();
        else  hideInfoBox();
}
var isBanBoxRevealed = false;
function revealBanBox(token, isRequest) {
    if(isRequest) isBanBoxRevealed = !isBanBoxRevealed; // toggle

    if(isBanBoxRevealed && license != "premium") {
        alertify.error("You need Premium to view the ban info! <a href='#' class='notifylink' onclick='switch_tab(`/View/Prices.html`)'>Click here to upgrade.</a>");
        return;
    }

    if(isBanBoxRevealed) {
        bansReset();

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                
                var parsed = true;
                var parsedData;
                try {
                    parsedData = JSON.parse(this.responseText);
                } catch (e) { parsed = false; }

                if(this.status == 200 && parsed) {
                    if(currentToken == parsedData.token) {
                        bansSetToUnknown();
                        displayBans(parsedData.results);
                    }
                } else {
                }
            }
        };
        xhttp.withCredentials = true;
        xhttp.open("POST", "https://bans.thealtening.com/bans/poll", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify({ account: { token: token }, server: null }));
    } else {
        bansReset();

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                
                var parsed = true;
                var parsedData;
                try {
                    parsedData = JSON.parse(this.responseText);
                } catch (e) { parsed = false; }

                if(this.status == 200 && parsed) {
                    if(currentToken == parsedData.token) {
                        bansSetToUnknown();
                        displayBans(parsedData.results);
                    }
                } else {
                }
            }
        };
        xhttp.withCredentials = true;
        xhttp.open("POST", "https://bans.thealtening.com/bans/poll", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify({ account: { token: token }, server: null }));
    }

    if(isRequest) 
        if(isBanBoxRevealed) $('#window-bans').slideDown();
        else   $('#window-bans').slideUp();
}

function hideInfoBox() {
    $('#window-info').slideUp();
}

var loadingAlt = false;
function loadAlt() {

    if(!currentToken) {
        alertify.error("Launch Alt failed to load alt, because no alt is selected.<br/> Please generate an alt and try again.");
        return;
    }

    window.open('altening://?m=sa&t=' + currentToken);
    alertify.delay(4000).success(`Launched Alt.`);
    return;

    if(loadingAlt) return;
    loadingAlt = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            loadingAlt = false;
            if(this.status == 200) {
                var parsed = JSON.parse(xhttp.responseText);
                loadAltCallback(parsed.message, parsed.status);
            } else alertify.delay(4000).error(`Could not Launch Alt, try again.`);
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/loader/bp", true);
    xhttp.send(JSON.stringify({
        message: 'ca',
        token: currentToken
    }));
    pingBackNotRunning  = 0;
    pingBackWrongServer = 0;
}

function loadAltPing() {
    setTimeout(function() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if(this.status == 200) {
                    var parsed = JSON.parse(xhttp.responseText);
                    loadAltCallback(parsed.message, parsed.status);
                } else alertify.delay(4000).error(`Could not Launch Alt, try again.`);
            }
        };
        xhttp.withCredentials = true;
        xhttp.open("POST", "https://api.thealtening.com/loader/bp", true);
        xhttp.send(JSON.stringify({
            message: 'cp',
            token: currentToken
        }));
    }, 4000);
}

var pingBackNotRunning  = 0;
var pingBackWrongServer = 0;
function loadAltCallback(message, status) {
    if(message === 'unknown') { // Display unexpected error, stop loading animation.
        loadAltShowState('failed-unknown');
    } else if(message === 'ca') {
        // Alt is loading, start animation.
        if(status.state) {
            loadAltShowState('loading');
            loadAltPing();
        } else {
            loadAltShowState('loading');
            setTimeout(function(){
                loadAltShowState('failed-expired');
            }, 1000);
        }
    } else if(message === 'cp') {
        // State parse.
        $('#launch-alt').fadeOut();

        if(status.state === 'x') { loadAltShowState('failed-unknown'); } // Terminate, failed inform the user.
        else if(status.state === 'w') { 

             if(!status.machine || status.machine.lastSeen === null || !status.machine.lastSeen) pingBackNotRunning++;
             if(!status.machine || status.machine.server === null || status.machine.server !== 'altening') pingBackWrongServer++;

             if(pingBackNotRunning > 3) {
                loadAltShowState('failed-machine'); 
            } else if(pingBackWrongServer > 3) {
                loadAltShowState('failed-machine'); 
            } else {
                // Ping again.
                loadAltPing(); 
             }
        
            } // Still waiting, ping another time.
        else if(status.state === 'l') { loadAltShowState('loaded'); } // Done loading.
    } 
}

function loadAltShowState(state) {
    if(state === 'loading') {
        $('#launch-alt').fadeOut("fast", function() {
            $('.circle-loader').removeClass('load-error');
            $('.checkmark').removeClass('error');
            $('.circle-loader').removeClass('load-complete');
            $('.checkmark').removeClass('draw');
            $('.checkmark').hide();

            $('#launch-alt-loader').fadeIn("fast");
        });
    } else if(state === 'loaded') {
        $('.circle-loader').removeClass('load-error').addClass('load-complete');
        $('.checkmark').removeClass('error').addClass('draw').show();
        setTimeout(function() {
            $('#launch-alt-loader').fadeOut("fast", function() {
                $('#launch-alt').fadeIn("fast");
            });
        },3000);
    } else if(state === 'failed-unknown') {
        alertify.error("Launch Alt failed for unknown reasons, try again.");
        $('.circle-loader').removeClass('load-complete').addClass('load-error');
        $('.checkmark').removeClass('draw').addClass('error').show();
        setTimeout(function() {
            $('#launch-alt-loader').fadeOut("fast", function() {    
                $('#launch-alt').fadeIn("slow");
            });
        }, 4500);
    } else if(state === 'failed-machine') {
        alertify.error("Launch Alt failed to load alt,<br/>because either the <b>authenticator is not open</b> or your authentication <b>server isn't switched to Altening<b/>.");
        $('.circle-loader').removeClass('load-complete').addClass('load-error');
        $('.checkmark').removeClass('draw').addClass('error').show();
        setTimeout(function() {
            $('#launch-alt-loader').fadeOut("fast", function() {
                $('#launch-alt').fadeIn("slow");
            });
        }, 4500);
    }
    else if(state === 'failed-expired') {
        alertify.error("Launch Alt failed due to expired token, generate a new account and try again.");
        $('.circle-loader').removeClass('load-complete').addClass('load-error');
        $('.checkmark').removeClass('draw').addClass('error').show();
        setTimeout(function() {
            $('#launch-alt-loader').fadeOut("fast", function() {
                $('#launch-alt').fadeIn("slow");
            });
        }, 4500);
    }
}

// Bans:
function displayBans(banData) {
    banData.forEach(bd=>{ displayBan(bd); });

    // Count bans.
    var banCount = 0;
    for (var i = 0; i < banData.length; i++)
        if(banData[i].status == 2) banCount++;
        
    $('#bans-display-text-attention').text(banCount);
    $('#bans-display-text-attention').fadeIn();
}

function displayBan(banData) {
    
    var element = serverToDomElement(banData.server);
    var img = element.getElementsByTagName('img')[0];
    var date = element.getElementsByClassName('ban-date-info')[0];
    
    switch(banData.status) {
        case 1:
            element.className = "ban-unbanned";
            img.src = "https://thealtening.com/Images/ban-unbanned.svg";
            img.style.visibility = 'visible';
            date.innerHTML = banData.date;
            break;
        case 2:
            element.className = "ban-banned";
            img.src = "https://thealtening.com/Images/ban-banned.svg";
            img.style.visibility = 'visible';
            date.innerHTML = banData.date;
            break;
        case -1:
            element.className = "";
            img.src = "https://thealtening.com/Images/ban-loading.svg";
            img.style.visibility = 'visible';
            date.innerHTML = '';
            break;
        default:
            element.className = "ban-unknown";
            img.style.visibility = 'hidden';
            date.innerHTML = 'Unknown';
            break;
    }
}
function displayCustomBan(banData) {
    var element = document.getElementById('bans-search-result-screen');
    var img = element.getElementsByTagName('img')[0];
    var date = element.getElementsByClassName('ban-date-info-custom')[0];
    var text = document.getElementById('ban-date-info-custom-text');
    var server = document.getElementById('ban-custom-server-address');

    setTimeout(function(){
        $('#bans-search-loading-screen').hide();
    }, 500);

    server.innerHTML = banData.server;
    switch(banData.status) {
        case 1:
            element.className = "ban-unbanned";
            img.src = "https://thealtening.com/Images/ban-unbanned.svg";
            img.style.visibility = 'visible';
            date.innerHTML = banData.date;
            text.innerHTML = "Unbanned";
            text.className = "ban-unbanned";
            break;
        case 2:
            element.className = "ban-banned";
            img.src = "https://thealtening.com/Images/ban-banned.svg";
            img.style.visibility = 'visible';
            date.innerHTML = banData.date;
            text.innerHTML = "Banned";
            text.className = "ban-banned";
            break;
        case 3:
            element.className = "ban-banned";
            img.src = "https://thealtening.com/Images/ban-banned.svg";
            img.style.visibility = 'visible';
            server.innerHTML = banData.message;
            date.innerHTML = '';
            text.innerHTML = banData.error;
            text.className = "ban-banned";
            break;
        default:
            element.className = "ban-unknown";
            img.style.visibility = 'hidden';
            date.innerHTML = banData.date;
            text.innerHTML = "Unknown";
            text.className = "ban-unknown";
            break;
    }
}

function bansReset() {
    var servers = [ "us.mineplex.com", "play.cubecraft.net", "play.cosmicpvp.me", "gommehd.net", "griefergames.net", "saicopvp.com", "minesaga.org", "play.vanitymc.co", "mineheroes.net", "play.minesuperior.com", "play.pvpwars.net", "play.invadedlands.net"];
    servers.forEach(server => {
        displayBan({status: -1, server: server})
    });
}
function bansSetToUnknown() {
    var servers = [ "us.mineplex.com", "play.cubecraft.net", "play.cosmicpvp.me", "gommehd.net", "griefergames.net", "saicopvp.com", "minesaga.org", "play.vanitymc.co", "mineheroes.net", "play.minesuperior.com", "play.pvpwars.net", "play.invadedlands.net"];
    servers.forEach(server => {
        displayBan({status: 0, server: server})
    });
}

function customServerEnterCheck(e) {
    if(event.key == 'Enter') bansQueue();
};

var banQueued = false;
function bansQueue() {

    if(banQueued) return;

    var address = $('#bans-search-custom-address').val();
    if(address.indexOf('.') == -1 || address.indexOf('@') != -1 || address.length < 3) {
        alertify.delay(4000).error(`Please enter a valid server address.`);
        setBanQueueState('none');
        return;
    } 

    if(pollInterval) clearInterval(pollInterval);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            banQueued = false;

            var parseSuccess = true;
            var parsed;
            try {
                parsed = JSON.parse(xhttp.responseText);
            }catch (e) { parseSuccess = false;}

            if(this.status == 200 && parseSuccess && parsed.success === true) {
                if(parsed.result) setBanQueueState('results', parsed.result);
                else {
                    // Begin polling.
                    var alt = currentToken;
                    pollInterval = setInterval(()=>{pollBanQueue(alt, address)}, 3000);
                }
            } else {
                alertify.delay(4000).error(`Could not Ban Check Alt${parseSuccess?': ' + parsed.message:', try again later.'}`);
                setBanQueueState('none');
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://bans.thealtening.com/bans/queue", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
        account: {
            token: currentToken
        },
        server: {
            domain: address
        }
    }));

    pollCount = 0;
    banQueued = true;
    setBanQueueState('load');
}

var pollInterval;
var pollCount = 0;
function pollBanQueue(alt, server) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
                
            var parsed = true;
            var parsedData;
            try {
                parsedData = JSON.parse(this.responseText);
            } catch (e) { parsed = false; }

            if(this.status == 200 && parsed) {
                if(currentToken == parsedData.token) {
                    pollCount++;

                    if(parsedData.results[0].status != 0 || ++pollCount > 25) {
                        clearInterval(pollInterval);
                        setBanQueueState('results', parsedData.results[0]);
                    }
                } else {clearInterval(pollInterval); setBanQueueState('none');}
            } else {
                clearInterval(pollInterval);
                setBanQueueState('none');
                alert('error: ' + this.responseText);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://bans.thealtening.com/bans/poll", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
        account: {
            token: alt
        },
        server: {
            domain: server
        }
    }));
}

function setBanQueueState(state, data, error_message) {
    if(state == 'none') {
        $('#bans-search-loading-screen').fadeOut("fast");
        $('#bans-search-result-screen').fadeOut("fast");
        $('#bans-search-logo').fadeIn("fast");
    }
    else if(state == 'load') {
        $('#bans-search-result-screen').fadeOut("fast");
        $('#bans-search-logo').fadeOut("fast", function() {
            $('#bans-search-loading-screen').fadeIn("fast");
        });    
    }
    else if(state == 'results') {
        $('#bans-search-logo').fadeOut("fast");
        $('#bans-search-loading-screen').fadeOut("fast", function() {
            $('#bans-search-result-screen').fadeIn("fast");
            displayCustomBan(data);
        });    
    }
    else if(state == "error") {
        $('#bans-search-logo').fadeOut("fast");
        $('#bans-search-loading-screen').fadeOut("fast", function() {
            $('#bans-search-result-screen').fadeIn("fast");
            displayCustomBan({
                status: 3,
                error: error_message,
                message: data
            });
        });        
    }
}

function serverToDomElement(server) {
    var row = 0, cell = 0;
    
    switch(server) {
        case "us.mineplex.com": row=0;cell=0; break;
        case "play.cubecraft.net": row=0;cell=1;  break;
        case "play.cosmicpvp.me": row=0;cell=2; break;
        case "gommehd.net": row=0;cell=3; break;
        case "griefergames.net": row=1;cell=0; break;
        case "saicopvp.com": row=1;cell=1; break;
        case "minesaga.org": row=1;cell=2; break;
        case "play.vanitymc.co": row=1;cell=3; break;
        case "mineheroes.net": row=2;cell=0; break;
        case "play.minesuperior.com": row=2;cell=1; break;
        case "play.pvpwars.net": row=2;cell=2; break;
        case "play.invadedlands.net":row=2;cell=3; break;
        default: console.log('serverToDomElement() invalid server: ' + server); break;
    }
    
    return document.getElementById('pre-selected-ban-info-table').rows[row].cells[cell];
}