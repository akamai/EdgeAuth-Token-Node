/**
 * Created by shan on 4/9/17.
 *
 * Akamai AuthToken Library for Node.JS
 */

var crypt = require('crypto')
    ,Log = require('log')
    ,logger = new Log('debug')
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

var AuthToken = function (options) {
    $ = this;

    var DEF = {
        DELIMIT_ACL: '!'
        ,DELIMIT_BODY: '~'
        ,WINDOW_SEC: 1*3600000 // 1h
        ,ACL_LIST: ["/*"]
        ,ALGORITHM: "sha256"
        ,ESCAPE_EARLY: true
        ,ESCAPE_EARLY_UPPER: true
        ,SUPPORT: {
            algorithm:["sha256","sha1","md5"]
        }
    };

    var fillDefaultOption = function(options) {
        var curDate = new Date();
        if (options == undefined || options == null)
            options = {};

        var newOptions = JSON.parse(JSON.stringify(options));
        newOptions["tokenName"] = options.tokenName || "_token_";
        newOptions["startTime"] = tokenUtil.dateToTimeSec(options.startTime) || tokenUtil.dateToTimeSec(curDate);
        newOptions["windowSeconds"] = options.endTime || DEF.WINDOW_SEC;
        //newOptions["accessList"] = options.accessList || def.ACL_LIST;
        newOptions["delimiter"] = options.delimiter || DEF.DELIMIT_BODY;
        newOptions["aclDelimiter"] = options.aclDelimiter || DEF.DELIMIT_ACL;
        newOptions["algorithm"] = options.algorithm || DEF.ALGORITHM;
        newOptions["escapeEarly"] = options.escapeEarly || DEF.ESCAPE_EARLY;
        newOptions["escapeEarlyUpper"] = options.escapeEarlyUpper || DEF.ESCAPE_EARLY_UPPER;

        return newOptions;
    };

    var isValidOptions = function(options) {
        if (options["tokenName"] && options["startTime"]
            && options["delimiter"] && options["aclDelimiter"]
            && options["key"] && options["algorithm"]) {

            var nIndex = 0;
            // algorithm
            for (nIndex = 0 ; nIndex < DEF.SUPPORT.algorithm.length ; nIndex++)
                if (DEF.SUPPORT.algorithm[nIndex] == options["algorithm"].toLowerCase().trim())
                    break;
            if (nIndex == DEF.SUPPORT.algorithm.length)
                throw ERR.VALIDATION.ALGORITHM.NOTSUPPORTED;

            // endTime , windowSeconds
            if (options["endTime"] || options["windowSeconds"]) {
                if (options["endTime"] // endTime should be greater than startTime
                    && tokenUtil.dateToTimeSec(options["endTime"]) < tokenUtil.dateToTimeSec(options["startTime"]) ) {
                    throw ERR.VALIDATION.TIME.ENDTIME_LESSER_THAN_STARTTIME;
                }else { // windowSeconds cannot be nagative
                    if (options["windowSeconds"] < 0)
                        throw ERR.VALIDATION.TIME.TIMEWINDOW_NEGATIVE;
                }
            }

            if (options["accessList"] || options["url"]) {
                if (options["accessList"] && options["url"])
                    throw ERR.VALIDATION.ACL.BOTHDEFINED;
            }else
                throw ERR.VALIDATION.ACL.NOTDEFINED;

            // key 검사
            if (!options["key"])
                throw ERR.VALIDATION.KEY.NOTDEFINED;

            return true;
        }

        logger.debug("Validation Result :", bValid);

        return bValid;
    };

    /**
     * Escape given 'src' text to URL Encoded.
     * If escapeEarly is set to true, encoded hex converted UPPER cases
     * @param src
     */
    var escapeEarly = function(src) {
        var txtOut = src;

        if ($.options["escapeEarly"]) {
            txtOut = encodeURIComponent(src);

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


    var getTokenIP = function () {

    };

    /**
     * Generate Token with previously given options
     * @returns {string}
     */
    this.generateToken = function() {
        var token = "";

        try {
            if (isValidOptions($.options)) {
                // Print options
                logger.info('##### Token Generation options ######\n', $.options);

                // endTime Calculation
                if (!$.options["endTime"] && $.options["windowSeconds"])
                    $.options["endTime"] = $.options["startTime"] + $.options["windowSeconds"];

                // build token string
                if ($.options["ipAddress"])
                    token += "ip=" + escapeEarly($.options["ipAddress"]) + DEF.DELIMIT_BODY;

                logger.info('Generated Token : ',token);
            }
        } catch (e) {
            logger.error(e);
            throw ERR.GENERATION.TOKEN_OPTION;
        }

        return token;
    };

    /**
     * Set ot merge Token generation options
     * @param options
     * @param merge merge with existing options if set to true
     */
    this.setOptions = function (options, merge) {
        if (merge)
            $.options = ju.mergePatch(options, $.options);
        else
            $.options = options;

        $.options = fillDefaultOption($.options);
    }

    this.options = fillDefaultOption(options || {});
};


module.exports = AuthToken;