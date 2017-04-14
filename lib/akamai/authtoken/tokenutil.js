/**
 * Created by shan on 4/15/17.
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

module.exports = tokenUtil;