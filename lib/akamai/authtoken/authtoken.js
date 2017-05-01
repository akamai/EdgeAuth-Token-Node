/**
 * Created by shan on 4/9/17.
 *
 * Akamai AuthToken Library for Node.JS
 */

var crypto = require('crypto')
    ,Log = require('log')
    ,logger = new Log('info')
    ,tokenUtil = require('./tokenutil')
    ,ERR = require('./static').ERR
    ,ju = require('json-util');

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
 *  escapeEarlyUpper : Causes strings to be url encoded before being used. (legacy 2.0 behavior)
 * }
 * @constructor
 */

var AuthToken = function (options, logLevel) {
    if (logLevel)
        logger = new Log(logLevel);
    $ = this;

    var DEF = {
        DELIMIT_ACL: '!'
        ,DELIMIT_BODY: '~'
        ,WINDOW_SEC: 0 //1*3600000 // 1h
        ,ACL_LIST: ["/*"]
        ,ALGORITHM: "sha256"
        ,ESCAPE_EARLY: false
        ,ESCAPE_EARLY_UPPER: false
        ,TOKEN_NAME: '__token__'
        ,SUPPORT: {
            algorithm:["sha256","sha1","md5"]
        }
    };

    var fillDefaultOption = function(options) {
        var curDate = new Date();
        if (options == undefined || options == null)
            options = {};

        var newOptions = JSON.parse(JSON.stringify(options));
        newOptions["tokenName"] = options.tokenName || DEF.TOKEN_NAME;
        newOptions["startTime"] = tokenUtil.dateToTimeSec(options.startTime) || tokenUtil.dateToTimeSec(curDate);
        newOptions["windowSeconds"] = options.windowSeconds || DEF.WINDOW_SEC;
        //newOptions["accessList"] = options.accessList || DEF.ACL_LIST;
        newOptions["delimiter"] = options.delimiter || DEF.DELIMIT_BODY;
        newOptions["aclDelimiter"] = options.aclDelimiter || DEF.DELIMIT_ACL;
        newOptions["algorithm"] = options.algorithm || DEF.ALGORITHM;
        newOptions["escapeEarly"] = options.escapeEarly || DEF.ESCAPE_EARLY;
        newOptions["escapeEarlyUpper"] = options.escapeEarlyUpper || DEF.ESCAPE_EARLY_UPPER;

        if (options["endTime"] && options["endTime"].constructor == String && options["endTime"].startsWith('now+'))
            newOptions['endTime'] = newOptions['startTime'] + new Number(options['endTime'].replace('now+',''));

        return newOptions;
    };

    var isValidOptions = function(options) {
        logger.debug("### options ###", options);
        if (options["tokenName"] && options["startTime"]
            && options["delimiter"] && options["aclDelimiter"]
            && options["key"] && options["algorithm"]) {

            var nIndex = 0;
            // algorithm
            for (nIndex = 0 ; nIndex < DEF.SUPPORT.algorithm.length ; nIndex++)
                if (DEF.SUPPORT.algorithm[nIndex] == options["algorithm"].toLowerCase().trim())
                    break;
            if (nIndex == DEF.SUPPORT.algorithm.length)
                throw new Error(ERR.VALIDATION.ALGORITHM.NOTSUPPORTED);

            // endTime , windowSeconds
            if (options["endTime"] || options["windowSeconds"] != undefined) {
                if (options["endTime"] // endTime should be greater than startTime
                    && tokenUtil.dateToTimeSec(options["endTime"]) < tokenUtil.dateToTimeSec(options["startTime"]) ) {
                    throw new Error(ERR.VALIDATION.TIME.ENDTIME_LESSER_THAN_STARTTIME);
                }else { // windowSeconds cannot be nagative
                    if (options["windowSeconds"] < 0)
                        throw new Error(ERR.VALIDATION.TIME.TIMEWINDOW_NEGATIVE);
                }
            }

            if (options["accessList"] || options["url"]) {
                if (options["accessList"] && options["url"])
                    throw new Error(ERR.VALIDATION.ACL.BOTHDEFINED);
                else if (options["accessList"] && options["accessList"].constructor != Array)
                    throw new Error(ERR.VALIDATION.ACL.MUSTARRAY);
            }else
                throw new Error(ERR.VALIDATION.ACL.NOTDEFINED);

            // key 검사
            if (!options["key"])
                throw new Error(ERR.VALIDATION.KEY.NOTDEFINED);

            return true;
        } else
            throw new Error(ERR.VALIDATION.NOT_ENOUGH_OPTIONS);

        return false;
    };

    /**
     * Escape given 'src' text to URL Encoded.
     * If escapeEarly is set to true, encoded hex converted UPPER cases
     * @param src
     */
    var escapeEarly = function(src) {
        var txtOut = src;

        if ($.options["escapeEarly"]) {

            txtOut = encodeURIComponent(src).replace(/[~'*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16);
            });

            var pattern = /%../g;

            if ($.options["escapeEarlyUpper"]) {
                txtOut = txtOut.replace(pattern, function(match) {
                    return match.toUpperCase();
                });
            }else
                txtOut = txtOut.replace(pattern, function(match) {
                    return match.toLowerCase();
                });
        }

        return txtOut;
    };

    var buildTokenString = function() {
        var token = "";
        // 1. IP Address
        if ($.options["ipAddress"])
            token += "ip=" + escapeEarly($.options["ipAddress"]) + $.options["delimiter"];

        // 2. Start Time
        token += "st=" + tokenUtil.dateToTimeSec($.options["startTime"]) + $.options["delimiter"];

        // 3. End Time
        token += "exp=" + tokenUtil.dateToTimeSec($.options["endTime"]) + $.options["delimiter"];

        // 4. ACL
        for (var index in $.options["accessList"]) {
            if (index == 0)
                token +="acl=";
            else
                token += escapeEarly($.options["aclDelimiter"]);

            token += escapeEarly($.options["accessList"][index]);

            if (index == $.options["accessList"].length-1)
                token += $.options["delimiter"];
        }

        // 5. session ID
        if ($.options["sessionId"]) {
            token += "id=" + escapeEarly($.options["sessionId"]) + $.options["delimiter"];
        }

        // 6. Token Payload
        if ($.options["payload"]) {
            token += "data=" + escapeEarly($.options["payload"]) + $.options["delimiter"];
        }

        return token;
    }

    /**
     * Generate Token with previously given options
     * @returns {string}
     */
    this.generateToken = function() {
        var token = "";

        try {
            if (isValidOptions($.options)) {
                // Print options
                logger.debug('##### Token Generation options ######\n', $.options);

                // endTime Calculation
                if (!$.options["endTime"] && $.options["windowSeconds"] != undefined)
                    $.options["endTime"] = tokenUtil.dateToTimeSec($.options["startTime"]) + $.options["windowSeconds"];

                // build token string
                token = buildTokenString();

                // HMAC
                var srcHmac = "" + token;
                if ($.options["url"])
                    srcHmac += "url=" + escapeEarly($.options["url"]) + $.options["delimiter"];
                if ($.options["salt"])
                    srcHmac += "salt=" + escapeEarly($.options["salt"]) + $.options["delimiter"];

                logger.debug("#### Hmac Src String : ", srcHmac);

                var key = new Buffer($.options["key"], 'hex');
                var hmac = crypto.createHmac($.options['algorithm'].toLowerCase(), key);
                hmac.update(srcHmac.substr(0, srcHmac.length-1));

                token = $.options["tokenName"] + "=" + token + "hmac=" + hmac.digest('hex');
                logger.debug('Generated Token : ',token);
            }
        } catch (e) {
            logger.error(e);
            throw new Error(ERR.GENERATION.TOKEN_OPTION);
        }

        return token;
    };

    /**
     * Set ot merge Token generation options
     * @param options
     * @param merge merge with existing options if set to true. not set or false will set given options replace to current options
     */
    this.setOptions = function (options, merge) {
        if (merge)
            $.options = ju.mergePatch($.options, options);
        else
            $.options = options;

        $.options = fillDefaultOption($.options);
    }

    this.options = fillDefaultOption(options || {});
};


module.exports = AuthToken;