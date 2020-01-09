var value_data = [];

function dashboardInit() {
    donwloadDashboardData(function(success){
        drawGraph();
    });
}

function donwloadDashboardData(callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var parsed = JSON.parse(xhttp.responseText);
            var code = this.status;
            if(code == 200) {
                
                value_data = parsed.spread;
                
                $('#me-gen-stats-day').text(parsed.me.day);
                $('#me-gen-stats-week').text(parsed.me.week);
                $('#me-gen-stats-month').text(parsed.me.month);
                $('#me-gen-stats-lifetime').text(parsed.me.lifetime);
                
                $('#global-gen-stats-day').text(parsed.global.day);
                $('#global-gen-stats-week').text(parsed.global.week);
                $('#global-gen-stats-month').text(parsed.global.month);
                $('#global-gen-stats-lifetime').text(parsed.global.lifetime);

                callback(true);
            } else {
                callback(false);
            }
        }
    };
    xhttp.withCredentials = true;
    xhttp.open("GET", "https://api.thealtening.com/me/dash", true);
    xhttp.send(null);
}

function setDashboardData() {
    $('#me-license-status').text(ban?"BANNED":(license_state?license:'Free'));
    if(expires) $('#account-tab-expires').text(ban?"-":(license_state?expires.substring(0, 10):'-'));
    else $('#account-tab-expires').text('-');
}

function drawGraph() {
    var ctx = document.getElementById("global-month-chart").getContext('2d');

    var label_data = [];
    for(var i = 30; i > 0; i--) {
        label_data.push(i.toString());
    }

    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: label_data,
            datasets: [{
                label: '# of Alts generated',
                data: value_data,
                backgroundColor: [
                    'rgba(44, 177, 148, 0.2)',
                ],
                borderColor: [
                    'rgba(44, 177, 148, 1)',
                ],
                pointColor: "rgba(44, 177, 148, 1)",
                pointBackgroundColor: "rgba(44, 177, 148, 1)",
                borderWidth: 2,
                pointHoverBackgroundColor: 'rgba(44, 177, 148, 1)',
                pointBorderColor: 'rgba(44, 177, 148, 1)',
            }]
        },
        options: {
            legend: {
                display: false,
            },
            scaleShowLabels: false,
            scales: {
                xAxes: [{
                    gridLines: {
                        display:false
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display:false
                    },
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}