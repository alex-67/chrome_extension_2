chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.executeScript(null, { file: "module.js" }, function () {
    }); 
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs[0];
        var url = tab.url;
    });
});
var count = 10;
var likesCount = 0;
var maxType = "Likes";
var ctx;
var men;
var women;
var unknown;
var ownerID_;
var itemID_;
var IDs;
var idIndex;
var tabID;
function vkLikesRequest(count_, offset, owner_id, item_id) {
    return 'http://api.vk.com/method/likes.getList?type=post&owner_id=' + owner_id + '&item_id=' + item_id + '&count=' + count_ + '&offset=' + offset;
}

function vkUsersRequest(ids, count_, limit) {
    //http://api.vk.com/method/users.get?user_ids=29077173,22823874,275459564&fields=sex,bdate,city,country,home_town,has_photo
    var str = 'http://api.vk.com/method/users.get?user_ids=';
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
        done();
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
}

function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

function done() {
    chrome.tabs.sendMessage(tabID, { mesType: "setChart", men: men, women: women, unknown: unknown, currPostID: IDs[idIndex] }, function (res) { });
    let curId = nextId();
    if (curId != null)
        runModule(curId);
}
function nextId() {
    idIndex += 1;
    if (idIndex < IDs.length)
        return IDs[idIndex];
    else
        return null;
}
function runModule(currPostID) {
    setPrBar(0);
    ownerID_ = currPostID.split('_')[0].replace('wpt', '');
    itemID_ = currPostID.split('_')[1];
    getVKData(function (data, width, height) {
    }, function (errorMessage) {
        //renderStatus('Cannot display image. ' + errorMessage);
    });
};
chrome.runtime.onMessage.addListener(
  function (req, sender, sendResponse) {
      if (req.mesType == "giveIds") {
          IDs = JSON.parse(req.ids);
          idIndex = 0;
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              tabID = tabs[0].id;
              runModule(IDs[0]);
          });
      };
  });