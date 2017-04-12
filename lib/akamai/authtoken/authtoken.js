/**
 * Created by shan on 4/9/17.
 *
 * Akamai AuthToken Library for Node.JS
 */

var crypt = require('crypto')
    ,Log = require('log');

var logger = new Log('debug');

/**
 * Util function for AuthToken
 * @type {{dateToTimeSec}}
 */
var tokenUtil = (function() {
    return {
        dateToTimeSec: function(date) {
            if (date.constructor == Date) {
                return date.getTime() / 1000 | 0;
            } else if (typeof date === "number") {
                return date;
            } else
                throw "Not Acceptable Type";
        }
    };
})();

var ERR = {
    VALIDATION: {
        TIMESLICE: {
            msg: "One of endTime or windowSeconds is needed"
            ,data: 0
        }
        ,ENDTIME_LTS: {
            msg: "endTime cannot be sooner than startTime"
            ,data: 0
        }
        ,NEGATIVE_TIMEWINDOW: {
            msg: "windowSeconds cannot be negative value"
            ,data: 0
        }
        ,NOACL_URL: {
            msg: "One of ACL or URL is needed"
            ,data: 0
        }
        ,BOTHACL_URL: {
            msg: "Both ACL and URL cannot be used at once"
            ,data: 0
        }
    }
    ,GENERATION: {
        TOKEN_OPTION: {
            msg: "Invalid Token Options for token generation"
            ,data: 0
        }
    }
};

/**
 *
 * @param objParam
 * {
 *  (NOT USED) tokenType : type of Token (Not Supported Yet),
 *  tokenName : name for the new token. [Default:hdnts],
 *  ipAddress : IP Address to restrict this token to,
 *  startTime : What is the start time. (in Seconds or Date Object),
 *  endTime : When does this token expire? endTime overrides window (in Seconds or Date Object),
 *  windowSeconds : How long is this token valid for? (in Seconds),
 *  url : URL path,
 *  accessList : Access control list in Array,
 *  key : Secret required to generate the token.,
 *  payload : Additional text added to the calculated digest.,
 *  algorithm : Algorithm to use to generate the token. (sha1, sha256, or md5) / default : sha256,
 *  salt : Additional data validated by the token but NOT included in the token body.,
 *  sessionId : The session identifier for single use tokens or other advanced cases.,
 *  delimiter : Character used to delimit token body fields. [Default:~],
 *  aclDelimiter : Character used to delimit acl fields. [Default:!], (Not Supported Yet)
 *  escapeEarly : Causes strings to be url encoded before being used. (legacy 2.0 behavior),
 *  (NOT USED) escapeEarlyUpper : Causes strings to be url encoded before being used. (legacy 2.0 behavior)
 * }
 * @constructor
 */

var AuthToken = function (options) {
    $ = this;

    var def = {
        DELIMIT_ACL: '!'
        ,DELIMIT_BODY: '~'
        ,DEF_WINDOW_SEC: 1*3600000 // 1h
        ,DEF_ACL_LIST: ["/*"]
        ,DEF_ALGORITHM: "sha256"
        ,SUPPORT: {
            algorithm:["sha256","sha1","md5"]
        }
    };

    var fillDefaultOption = function(options) {
        var curDate = new Date();
        if (options == undefined || options == null)
            options = {};

        var newOptions = JSON.parse(JSON.stringify(options));
        newOptions["tokenName"] = options.tokenName || "hdnts";
        newOptions["startTime"] = options.startTime || tokenUtil.dateToTimeSec(curDate);
        newOptions["windowSeconds"] = options.endTime || def.DEF_WINDOW_SEC;
        //newOptions["accessList"] = options.accessList || def.DEF_ACL_LIST;
        newOptions["delimiter"] = options.delimiter || def.DELIMIT_BODY;
        newOptions["aclDelimiter"] = options.aclDelimiter || def.DELIMIT_ACL;
        newOptions["algorithm"] = options.algorithm || def.DEF_ALGORITHM;

        return newOptions;
    };

    var isValidOptions = function(options) {
        var bValid = false;

        if (options["tokenName"] && options["startTime"]
            && options["delimiter"] && options["aclDelimiter"]
            && options["key"]) {
            if (options["endTime"] || options["windowSeconds"]) {
                if (options["endTime"] // endTime should be greater than startTime
                    && tokenUtil.dateToTimeSec(options["endTime"]) < tokenUtil.dateToTimeSec(options["startTime"]) ) {
                    throw ERR.VALIDATION.ENDTIME_LTS;
                }else { // windowSeconds cannot be nagative
                    if (options["windowSeconds"] < 0)
                        throw ERR.VALIDATION.NEGATIVE_TIMEWINDOW;
                }

                if (options["accessList"] || options["url"]) {
                    logger.debug("v3 passed");
                    if (options["accessList"] && options["url"])
                        throw ERR.VALIDATION.BOTHACL_URL;

                    bValid = true;
                }
            }
        }

        logger.debug("Validation Result :", bValid);

        return bValid;
    };

    this.options = fillDefaultOption(
        JSON.parse(JSON.stringify(options || {})));

    this.generateToken = function() {
        if (isValidOptions($.options)) {
            // endTime Calculation

        }else {
            logger.error(ERR.GENERATION.TOKEN_OPTION.msg, $.options);
            throw ERR.GENERATION.TOKEN_OPTION;
        }
    }
};

AuthToken.prototype.getOptions = function() {
    return this.options;
}

/* Setters */
AuthToken.prototype.setTokenType = function(tokenType) {
    this.options["tokenType"] = tokenType;
};

AuthToken.prototype.setTokenName = function(tokenName) {
    this.options["tokenName"] = tokenName;
};

AuthToken.prototype.setIpAddress = function(ipAddress) {
    this.options["ipAddress"] = ipAddress;
};

AuthToken.prototype.setStartTime = function(startTime) {
    this.options["startTime"] = tokenUtil.dateToTimeSec(startTime);
};

AuthToken.prototype.setEndTime = function(endTime) {
    this.options["endTime"] = tokenUtil.dateToTimeSec(endTime);
};

AuthToken.prototype.setWindowSeconds = function(windowSeconds) {
    this.options["windowSeconds"] = windowSeconds;
};

AuthToken.prototype.setUrl = function(url) {
    this.options["url"] = url;
};

AuthToken.prototype.setAccessList = function(accessList) {
    this.options["accessList"] = accessList;
};

AuthToken.prototype.setKey = function(key) {
    this.options["key"] = key;
};

AuthToken.prototype.setPayload = function(payload) {
    this.options["payload"] = payload;
};

AuthToken.prototype.setAlgorithm = function(algorithm) {
    this.options["algorithm"] = algorithm;
};

AuthToken.prototype.setSalt = function(salt) {
    this.options["salt"] = salt;
};

AuthToken.prototype.setSessionId = function(sessionId) {
    this.options["sessionId"] = sessionId;
};

AuthToken.prototype.setDelimiter = function(delimiter) {
    this.options["delimiter"] = delimiter;
};

AuthToken.prototype.setEscapeEarly = function(escapeEarly) {
    this.options["escapeEarly"] = escapeEarly;
};

AuthToken.prototype.setEscapeEarlyUpper = function(escapeEarlyUpper) {
    this.options["escapeEarlyUpper"] = escapeEarlyUpper;
};


module.exports = AuthToken;