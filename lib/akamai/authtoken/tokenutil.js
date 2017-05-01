/**
 * Created by shan on 4/15/17.
 */

var excel = require('excel-as-json')
    ,fs = require('fs')
    ,path = require('path');

var tokenUtil = (function() {

    var stripParam = function(src) {
        var re = /\$\{.*?\}/g;
        return src.replace(re, "");
    };

    return {
        dateToTimeSec: function(date) {
            if (date && date.constructor == Date) {
                return date.getTime() / 1000 | 0;
            }else if (date && date.constructor == String && date.toLowerCase() === 'now') {
                return Date.now() / 1000 - 10 | 0;
            }

            return date;
        }
        ,replaceParam: function (src, params) {
            //console.log("params : ", params);
            var srcText = src;
            if (typeof src != 'string')
                srcText = JSON.stringify(src);

            for (var p in params) {
                //console.log(p + " : " + params[p]);
                var match = "\\$\\{"+p+"\\}";
                var re = new RegExp(match,"gi");
                srcText = srcText.replace(re,params[p]);
            }
            srcText = stripParam(srcText);
            //console.log("SRCTEXT: " + srcText);
            return JSON.parse(srcText);
        }
        ,parseData: function (dataFilePath, options, callback) { // parse data into JSON Object
            ext = path.extname(dataFilePath).toLowerCase()
            if (ext.includes("xls")) {
                excel.processFile(dataFilePath, undefined, options,  callback);
            } else if (ext.includes("json")) {
                JSON.parse(fs.readFile(dataFilePath,callback));
            }
        }
        ,isNumber : function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    };
})();

module.exports = tokenUtil;