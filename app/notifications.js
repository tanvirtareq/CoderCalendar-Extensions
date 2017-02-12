var moment = require('moment');

var Util = require('./util');
var Settings = require('./settings');

var isDuplicate = function(){
    return false;
}

var isValidAlertData = function(){
    return true;
}

var getCurTime = function (){
    var d = new Date();
    var offset = -(d.getTimezoneOffset());
    return (d.getTime() + offset*60000 - 19800000);
}

/*
    yes - alert is scheduled to be within a minute
    no - alert is scheduled to be after a minute
    ignore - alert time is already over
*/
var isServisable = function(notification){
    var curTime = getCurTime();
    var alertTime = parseInt(notification.alertTime);

    if((curTime - alertTime) > 60000)
        return "ignore"
    else if(Math.abs(alertTime - curTime) <= 60000)
        return "yes"
    else
        return "no"
}

var sortByAlertTime = function(a, b){
    var keyA = a.alertTime,
        keyB = b.alertTime;

    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
}

var saveToQueue = function (contest, alertTime){
    chrome.storage.local.get("NOTIFICATIONQueue", function(response){
        var notificationQueue = response.NOTIFICATIONQueue;
        // TODO: comment out below
        var curTime = getCurTime();
        var alertTime = curTime + (1000 * 60 * 2);
        // 

        if(isValidAlertData(contest, alertTime) && !isDuplicate(contest, alertTime)){
            notificationQueue.push({"alertTime": alertTime, "contest": contest});
            notificationQueue.sort(sortByAlertTime);
            chrome.storage.local.set({"NOTIFICATIONQueue": notificationQueue}, function(){});
        }
    });
}

var serviceQueue = function (){
    chrome.storage.local.get("NOTIFICATIONQueue", function(response){
        console.log(response);
        var notificationQueue = response.NOTIFICATIONQueue;
        var servicedRequests = 0;
        for (var i = 0; i <= notificationQueue.length - 1; i++) {
            var notification = notificationQueue[i];
            var contest = notification.contest;
            var servisableStatus = isServisable(notification);
            if(servisableStatus == "yes"){

                var curTime = getCurTime();
                var startTime = Date.parse(contest.StartTime);
                var beginInTime = moment.duration(startTime - curTime).humanize();
                var opt = {
                  type: "basic",
                  title: contest.Name,
                  message: "will begin in about " + beginInTime,
                  iconUrl: Util.icon_path(contest.Platform),
                  buttons: [{"title": "Snooze"}, {"title": "Dismiss"}],
                }

                !function outer(contest){
                    chrome.notifications.create(opt, function(currentNotificationId){
                        chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
                            chrome.notifications.clear(notificationId, function(){
                                if(notificationId == currentNotificationId && buttonIndex == 0){
                                    snooze(contest);
                                }
                            });
                        });
                    });
                }(contest)

                servicedRequests = servicedRequests + 1;
            }else if(servisableStatus == "ignore"){
                servicedRequests = servicedRequests + 1;
            }else{
                break;
            }
        }
        notificationQueue = notificationQueue.slice(servicedRequests);
        chrome.storage.local.set({"NOTIFICATIONQueue": notificationQueue}, function(){});
    });
}

var addAlert = function(contest){
    Settings.getAlertBeforeTime(function(response){
        var alertBefore = response['ALERT_BEFORE_TIME'];
        var startTime = Date.parse(contest.StartTime);
        var alertTime = startTime - alertBefore;
        saveToQueue(contest, alertTime);
    });
}

var snooze = function(contest){
    Settings.getSnoozeInterval(function(response){
        var snoozeTime = response['SNOOZE_INTERVAL'];
        var curTime = getCurTime();
        var alertTime = curTime + snoozeTime;
        saveToQueue(contest, alertTime);
    });
}


module.exports = {
    addAlert: addAlert,
    serviceQueue: serviceQueue
};