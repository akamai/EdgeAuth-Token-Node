/**
 * Created by shan on 4/15/17.
 */

var tokenUtil = (function() {
    return {
        dateToTimeSec: function(date) {
            if (date && date.constructor == Date) {
                return date.getTime() / 1000 | 0;
            }

            return date;
        }
    };
})();

module.exports = tokenUtil;