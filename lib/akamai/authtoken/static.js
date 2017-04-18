/**
 * Created by shan on 4/15/17.
 */

var $ = {};
module.exports = $;

$.ERR = {
    VALIDATION: {
        KEY : {
            NOTDEFINED: "Key is not defined"
        }
        ,TIME : {
            SLICE_NOTENOUGH:
                "One of endTime or windowSeconds is needed"
            ,ENDTIME_LESSER_THAN_STARTTIME: "endTime cannot be sooner than startTime"
            ,TIMEWINDOW_NEGATIVE: "windowSeconds cannot be negative value"
        }
        ,ACL: {
            NOTDEFINED: "one of accessList or url is not specified"
            ,BOTHDEFINED: "Both ACL and URL cannot be used at once"
            ,MUSTARRAY: "ACL option should be an Array"
        }
        ,ALGORITHM: {
            NOTSUPPORTED: "Specified algorithm is not supported"
        }
        ,NOT_ENOUGH_OPTIONS: "Not enough options to generate token"
    }
    ,GENERATION: {
        TOKEN_OPTION: "Invalid Token Options for token generation"
    }
};