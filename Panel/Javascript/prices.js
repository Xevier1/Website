var busy = false;
var isUpgrade = false;
var isExtension = false;
var licenseId = 0;
var couponAmount = 1;
var coupon;
var duration = [
    30,
    90,
    180,
    365, 
    -1
];

function pricesOverlayOn(name, id, price) {

    if (!valid) {
        window.location.href = "/login";
        return;
    }

    // Check if downgrade.
    var curId = -5; // Nothing be default
    if (license_state) {
        if (license == 'basic') curId = 0;
        else if (license == 'premium') curId = 1;
        else if (license == 'starter') curId = -1;
    }
    var tempId = id;
    if (tempId == 2) tempId = -1;
    if (curId > tempId) {
        alertify.success('Already have a plan 🤗');
        return;
    }

    // Check if it is an upgrade.
    isUpgrade = license != undefined && Date.now() < new Date(expires);
    if (curId == tempId) {
        isUpgrade = false;
        isExtension = true;
    } else isExtension = false;

    if (isUpgrade) document.getElementById('prices-upgrade').style.visibility = "visible";
    else document.getElementById('prices-upgrade').style.visibility = "collapse";

    if(name == "Starter") {
        $('#lifetime-option-dropdown').prop('disabled', true);
        if($('#timeId').val() == null) {
            $("#timeId").val(3);
        }
    } else {
        $('#lifetime-option-dropdown').prop('disabled', false);    
    }

    licenseId = id;
    calculateDisplayPrice();

    $('#prices-overlay-name').text(isUpgrade ? 'Upgrade to ' + name + ' Monthly Package' : 'Monthly ' + name + ' Package' + (isExtension ? ' (Extension)' : ''));
    $('#prices-overlay-price').text('$' + price);

    var overlays = document.getElementsByClassName("overlay");
    for (var i = 0; i < overlays.length; i++)
        overlays[i].style.display = "block";
}

function pricesOverlayOff() {
    if (busy) return; // Do not disable when loading purchase.
    var overlays = document.getElementsByClassName("overlay");
    for (var i = 0; i < overlays.length; i++)
        overlays[i].style.display = "none";
    document.getElementById('purchase-button-spinner').style.display = 'none';
}

function checkPaymentRequirements(type) {
    if (!document.getElementById('tos-checkbox').checked) {
        $('#price-error').text("Please read and accept the terms of service first.");
        return false;
    }
    if (type === 'crypto' && $("input[name='sub-type-group']:checked").val() == "subscription") {
        $('#price-error').text("Only PayPal payments support subscriptions, please select \"One-Time Payment\".");
        return false;
    }

    return true;
}

function cancelSubscription() {
    if (busy) return;
    busy = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status != 200) {
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(15000).error(`Error: ` + parsed.errorMessage);
                } catch (ex) { alertify.delay(15000).error(`Error: could not cancel subscription, please contact the staff.`); }
                busy = false;
            } else {
                alertify.delay(15000).success(`The subscription has been cancelled. (An email has been dispatched to confirm this)`);
                window.location.href = redirectUrl;
            }

            document.getElementById('purchase-crypto-button-spinner').style.display = 'none';
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/billing/cancel", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify());
}

function executePurchaseCrypto(coin) {
    if (!checkPaymentRequirements('crypto')) return;
    if (busy) return;
    busy = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {

            var redirectUrl;
            try {
                redirectUrl = JSON.parse(this.responseText).url;
            } catch (ex) {
                redirectUrl = '#prices';
            }

            if (this.status != 200) {
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(5000).error(`Error: ` + parsed.errorMessage);
                    $('#price-error').text(parsed.errorMessage);
                } catch (ex) { alertify.delay(5000).error(`Error: could not redirect to PayPal, try again later.`); }
                busy = false;
            } else {
                window.location.href = redirectUrl;
            }

            document.getElementById('purchase-crypto-button-spinner').style.display = 'none';
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/billing/purchase", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        type: 'crypto',
        coin: coin,
        license: licenseId,
        time: $('#timeId').val(),
        coupon: coupon
    }));
    document.getElementById('purchase-crypto-button-spinner').style.display = '';
}

function executePurchase() {
    if (!checkPaymentRequirements('paypal')) return;
    if (busy) return;
    busy = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {

            var redirectUrl;
            try {
                redirectUrl = JSON.parse(this.responseText).url;
            } catch (ex) {
                redirectUrl = '#prices';
            }

            if (this.status != 200) {
                try {
                    var parsed = JSON.parse(this.responseText);
                    alertify.delay(5000).error(`Error: ` + parsed.errorMessage);
                    $('#price-error').text(parsed.errorMessage);
                } catch (ex) { alertify.delay(5000).error(`Error: could not redirect to PayPal, try again later.`); }
                busy = false;
            } else {
                window.location.href = redirectUrl;
            }

            document.getElementById('purchase-button-spinner').style.display = 'none';
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/billing/purchase", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        type: 'paypal',
        license: licenseId,
        time: $('#timeId').val(),
        coupon: coupon,
        subscription: $("input[name='sub-type-group']:checked").val() == "subscription"
    }));
    document.getElementById('purchase-button-spinner').style.display = '';
}

function applyCoupon() {
    if (busy) return;
    coupon = $('#coupon-input').val();
    if (coupon.length < 2) return;
    busy = true;

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {

            var couponPerc;
            try {
                couponPerc = JSON.parse(this.responseText).perc;
            } catch (ex) {
                couponPerc = 1;
            }

            if (this.status != 200) {
                try {
                    couponAmount = 1;
                    coupon = '';
                    $('#coupon-input').val('');
                } catch (ex) {}
                alertify.delay(5000).error(`Coupon is invalid or already used.`);
            } else {
                couponAmount = couponPerc;
                alertify.delay(5000).success(`Coupon applied!`);
            }

            calculateDisplayPrice();
            document.getElementById('coupon-button-spinner').style.display = 'none';
            busy = false;
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("POST", "https://api.thealtening.com/billing/coupon", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(JSON.stringify({
        coupon: coupon
    }));
    document.getElementById('coupon-button-spinner').style.display = '';
}

Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
        '/',
        (mm > 9 ? '' : '0') + mm,
        '/',
        (dd > 9 ? '' : '0') + dd
    ].join('');
};


function calculateDisplayPrice() {
    var prices = [
        6,
        12,
        3.36
    ];
    var mult = [
        1,
        3,
        6,
        12,
        30
    ];
    var disc = [
        1,
        0.90,
        0.80,
        0.70,
        1
    ];

    var deduction = 0;
    if (isUpgrade) {
        var curId = 0;
        if (license == 'basic') curId = 0;
        else if (license == 'premium') curId = 1;
        else if (license == 'starter') curId = 2;

        var days = days_between(Date.now(), new Date(expires));
        if (days > 30) days = 30;
        deduction = prices[curId] / 30 * days;
        deduction = deduction * 0.9;
        deduction = deduction.toFixed(2);

        $('#prices-upgrade-deduction').text('- $' + deduction);
    }

    var price = (((prices[licenseId] * mult[$('#timeId').val()] * disc[$('#timeId').val()] - deduction) * couponAmount)).toFixed(2);
    $('#total-price-display').text('$' + price);

    if($('#timeId').val() == 4) {
        // Lifetime purchase.
        $('#prices-overlay-date').text(`(No future payments)`);
        $('#subscription-option').fadeOut();
        $('#one-time-option').fadeOut();
    } else {
        $('#subscription-option').fadeIn();
        $('#one-time-option').fadeIn();
        setDate();
    }
}

function setDate() {
    var date = isExtension ? new Date(expires) : new Date();
    date.setDate(date.getDate() + (duration[$('#timeId').val()]));
    $('#prices-overlay-date').text(`(${$("input[name='sub-type-group']:checked").val()=="subscription"?'Next payment ':'Expires on'} ${date.yyyymmdd()})`);
}

function days_between(date1, date2) {

    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    var date1_ms = date1;
    var date2_ms = date2;

    // Calculate the difference in milliseconds
    var difference_ms = Math.abs(date1_ms - date2_ms);

    // Convert back to days and return
    return Math.round(difference_ms / ONE_DAY);

}

// Non-windows machines warning.
setTimeout(function() {
    if (navigator.platform.indexOf('Win') == -1) {
        alertify.delay(30000).error("We have detected your operating system to be non-windows,<br/> please do note that we do not natively support that operating system and you will be unable to use our authenticator,<br/>however you can use clients that have integrated our API.<br/>Please join the support discord if you'd like more information on this.", 0);
    }
}, 2000);

function billingRecurranceOption(option) {
    if (option === 'sub') {
        setDate();
    }
}