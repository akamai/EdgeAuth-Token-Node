/**
 * Created by shan on 4/23/17.
 */

var util = require('../../lib/akamai/authtoken/tokenutil')
    ,ju = require('json-util')
    ,fs = require('fs')
    ,async = require('async');

var templateRtc = {
    "${cn1}": {
        "_edge": {
            "url": "${reqUrl}",
            "escape": "${edgeEscape}",
            "queryString": "${qs}",
            "tokenLocation": "${tokenLocation}",
            "tokenName": "${edgeTokenName}",
            "ignoreQueryString": "${edgeIgnoreQueryString}",
            "algorithm": "${edgeAlgorithm}",
            "transitionKey": "${edgeTransitionKey}",
            "salt": "${edgeSalt}",
            "method": "${method}",
            "key": "${key}",
            "triggeredAt": "${triggeredAt}",
        },
        "${cn2}": {
            "tcName": "${cn1}.${cn2}",
            "accessList": "${accessList}",
            "delimiter": "${delimiter}",
            "endTime": "${endTime}",
            "escapeEarly": "${early}",
            "escapeEarlyUpper": "${earlyUpper}",
            "ipAddress": "${ipAddress}",
            "key": "${key}",
            "payload": "${salt}",
            "salt": "${salt}",
            "sessionId": "${sessionId}",
            "startTime": "${startTime}",
            "tokenName": "${tokenName}",
            "url": "${url}",
            "windowSeconds": "${windowSeconds}",
            "verbosity": "${verbosity}",
            "expect": {
                "code": "${expected}"
            }
        }
    }
};

function refineParsedRtc(rtc) {
    for (var index in rtc) {
        //console.log(rtc[index]);
        if (rtc[index].constructor == String) {
            //console.log("String: " + rtc[index]);
            rtc[index] = rtc[index].trim();
            if (rtc[index] === '-') {
                delete rtc[index];
            }else if (rtc[index].toLowerCase() === 'o') {
                rtc[index] = true;
            }else if (rtc[index].toLowerCase() === 'x') {
                rtc[index] = false;
            }else if (rtc[index].includes(',')) {
                var vals = rtc[index].split(',');
                for (var valIndex in vals) {
                    vals[valIndex] = vals[valIndex].trim();
                    if (util.isNumber(vals[valIndex])) {
                        vals[valIndex] = Number.parseInt(vals[valIndex]);
                    }
                }
                rtc[index] = vals;
            }else if (index == "accessList") {
                rtc[index] = new Array(rtc[index]);
            }else if (index == "code") {
                var vals = new Array();
                vals.push(Number.parseInt(rtc[index]));
                rtc[index] = vals;
            }else if (util.isNumber(rtc[index])) {
                rtc[index] = Number.parseInt(rtc[index]);
            }
        }else if (rtc[index].constructor == Object) {
            rtc[index] = refineParsedRtc(rtc[index]);
        }
    }

    return rtc;
}

async.map([[2,'./test/test_remote_query.json'],[3,'./test/test_remote_cookie.json'],
    [4,'./test/test_remote_header.json'],[5,'./test/test_remote_salt.json']], function(option,callback) {
    util.parseData('./test/generator/TestMetrics_src.xlsx', {sheet: option[0]}, function (err, data) {

        var rtc = {};

        var testCaseCount = 0;
        for (var index in data) {
            var param = data[index];
            var tempRtc = refineParsedRtc(util.replaceParam(templateRtc, param));

            rtc = ju.mergePatch(rtc, tempRtc);
            testCaseCount++;
        }

        fs.writeFile(option[1], JSON.stringify(rtc, null, '\t'), function () {
            console.log("Generating DONE : " + Object.keys(rtc).length + " Remote Case and " + testCaseCount + " test cases are written.");
            callback(null);
        });

    });
},function(){
    console.log("ALL JOBS DONE");
});