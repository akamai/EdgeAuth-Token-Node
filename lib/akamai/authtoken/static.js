/**
 * Created by shan on 4/15/17.
 */

var $ = {};
module.exports = $;

$.ERR = {
    VALIDATION: {
        KEY : {
            NOTDEFINED: {
                msg: "Key is not defined", data:0
            }
        }
        ,TIME : {
            SLICE_NOTENOUGH: {
                msg: "One of endTime or windowSeconds is needed", data:0
            }
            ,ENDTIME_LESSER_THAN_STARTTIME: {
                msg: "endTime cannot be sooner than startTime", data:0
            }
            ,TIMEWINDOW_NEGATIVE: {
                msg: "windowSeconds cannot be negative value", data:0
            }
        }
        ,ACL: {
            NOTDEFINED: {
                msg: "one of accessList or url is not specified", data: 0
            }
            ,BOTHDEFINED: {
                msg: "Both ACL and URL cannot be used at once", data: 0
            }
        }
        ,ALGORITHM: {
            NOTSUPPORTED: {
                msg: "Specified algorithm is not supported", data:0
            }
        }
    }
    ,GENERATION: {
        TOKEN_OPTION: {
            msg: "Invalid Token Options for token generation"
            ,data: 0
        }
    }
};