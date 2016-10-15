var count = 10;
var likesCount = 0;
var maxType = "Likes";
var ctx;
var men;
var women;
var unknown;
var ownerID_;
var itemID_;
var currPostID;

function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        var tab = tabs[0];
        var url = tab.url;

        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });
}

function parseDomain(url) {
    if (url.includes('w=wall')) {
        var str = url.substr(url.indexOf('?') + 1);
        str = str.replace('w=wall', '').replace('%2Fall', '');
        var arr = str.split('_');
        ownerID_ = arr[0];
        owner_id = arr[0];
        itemID_ = arr[1];
        return owner_id;
    } else {
        document.getElementById('status').textContent += 'Domain:' + url.replace('https://vk.com/', '') + '\n';
        var str = url.replace('https://vk.com/', '');
        if (str.indexOf("public") == 0) str = str.replace('public', '');
        return str;
    }
}

function vkLikesRequest(count_, offset, owner_id, item_id) {
    return 'https://api.vk.com/method/likes.getList?type=post&owner_id=' + owner_id + '&item_id=' + item_id + '&count=' + count_ + '&offset=' + offset;
}

function vkUsersRequest(ids, count_, limit) {
    //http://api.vk.com/method/users.get?user_ids=29077173,22823874,275459564&fields=sex,bdate,city,country,home_town,has_photo
    var str = 'https://api.vk.com/method/users.get?user_ids=';
    for (var i = count_; i < ids.length && i < (count_ + limit) ; i++) {
        str += ids[i] + ',';
    }
    str = str + '&fields=sex';
    return str.replace(',&', '&');
}

function getVKData(callback, errorCallback) {
    //var domain=parseDomain(searchTerm);
    var res;
    var x = new XMLHttpRequest();
    var req = vkLikesRequest(1, 0, ownerID_, itemID_);
    men = 0;
    women = 0;
    unknown = 0;
    x.open('GET', req);
    x.responseType = 'json';
    x.onload = function () {
        var res = x.response;
        likesCount = res.response.count;
        callback_vk(0);
    }
    x.onerror = function () {
        errorCallback('Network error.');
        errorCallback('Network error.' + x.statusText);
    };
    x.send();

}

function getNumber(data, what) {
    var num = 0;
    switch (what) {
        case "Likes":
            num = data.likes.count;
            break;

        case "Reposts":
            num = data.reposts.count;
            break;

        case "Comments":
            num = data.comments.count;
            break;

        default:
    }
    return num;
}

function callback_vk(j) {
    if (j >= likesCount / 1000) {
        setPrBar(j + 1);
        setDataInPie();
    }
    else {
        var x = new XMLHttpRequest();
        x.open('GET', vkLikesRequest(1000, j * 1000, ownerID_, itemID_));
        x.responseType = 'json';
        x.onload = function () {
            var res = x.response;
            if (res.response.users.length <= 200) {

                var x1 = new XMLHttpRequest();
                var req = vkUsersRequest(res.response.users, 0, 200);
                x1.open('GET', req);
                x1.responseType = 'json';
                x1.onload = function () {
                    var res1 = x1.response;
                    for (var i = 0; i < res1.response.length; i++) {
                        switch (res1.response[i].sex) {
                            case 1:
                                women++;
                                break;
                            case 2:
                                men++;
                                break;
                            case 0:
                                unknown++;
                                break;
                            default:
                        }
                    }
                    setPrBar(j + 1);
                    callback_vk(j + 1);
                }
                x1.send();

            } else {

                loadUsersSex(0, res.response.users, 200, j);

            }
        }
        x.send();
    }
}

function loadUsersSex(cur_count, ids, limit, j) {
    var x1 = new XMLHttpRequest();
    var req = vkUsersRequest(ids, cur_count, limit);
    x1.open('GET', req);
    x1.responseType = 'json';
    x1.onload = function () {
        var res1 = x1.response;
        for (var i = 0; i < res1.response.length; i++) {
            switch (res1.response[i].sex) {
                case 1:
                    women++;
                    break;
                case 2:
                    men++;
                    break;
                case 0:
                    unknown++;
                    break;
                default:
            }
        }
        if (ids.length - cur_count <= limit) {
            setPrBar(j + 1);
            callback_vk(j + 1);
        }
        else
            loadUsersSex(cur_count + limit, ids, limit, j);
    }
    x1.send();
}

function setPrBar(j) {
    var k = likesCount / 1000;
    if (likesCount % 1000 != 0) k += 1;
    //document.getElementById('prbar').style='width:' + j*100/k +'%';
    //$('.progress-bar').css('width', j*100/k +'%').attr('aria-valuenow', j*100/k); 
}

function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

function setDataInPie() {
    var data = [
        {
            value: 100,
            color: "#F7464A",
            highlight: "#FF5A5E",
            label: "Men"
        },
        {
            value: 500,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "Women"
        },
        {
            value: 100,
            color: "#FDB45C",
            highlight: "#FFC870",
            label: "Unknown"
        }
    ];
    data[0].value = men;
    data[1].value = women;
    data[2].value = unknown;
    $('#' + currPostID).append('<canvas id="myChart" width="50" height="50"></canvas>');
    $('#' + currPostID + " .wall_post_text").addClass("col-sm-10");
    $('#' + currPostID).wrapIner('<div class="row"></div>');
    var ctx = document.getElementById("myChart").getContext("2d");
    var myPieChart = new Chart(ctx).Pie(data);
}

function runModule(currPostID) {
    setPrBar(0);
    ownerID_ = currPostID.split('_')[0].replace('wpt-', '');
    itemID_ = currPostID.split('_')[1];
    getVKData(function (data, width, height) {
    }, function (errorMessage) {
        //renderStatus('Cannot display image. ' + errorMessage);
    });
};
$('._wall_post_cont').each(function () {
    currPostID = $(this).attr('id');
    runModule(currPostID);
});

