/**
 * Created by shan on 4/21/17.
 */
var expect = require('chai').expect,
    AuthToken = require('../lib/akamai/authtoken/authtoken.js'),
    request = require('request'),
    fs = require('fs'),
    mlogger = require('mocha-logger'),
    Log = require('log'),
    logger = new Log('info'),
    async = require('async');

var rtd = {};

/**
 * Make request object
 * @param done mocha done callback
 * @param rtcCaseName (string) Remote Test Case Name in test_remote_xxx.json file. ex) 'rtc1'
 * @param optionsName (string) Remote Test Case token options name in test_remote_xxx.json file. ex) 'a'
 * @returns {request} request object
 */
function makeRequest(done, rtcCaseName, optionsName) {
    var rtcCase = rtd[rtcCaseName];
    if (!rtcCase) {
        done(new Error("Invalid Case Name"));
        return;
    }

    var options = rtcCase[optionsName];
    if (!options) {
        done(new Error("Invalid token options name in Test Case File"));
        return;
    }

    logger = new Log(options.verbosity || 'info');
    logger.debug("Test Case Name: ", options.tcName);

    // assert required Remote Test Case data is configured to test_remote_xxx.json
    expect(rtcCase['_edge']['url']).to.exist;
    expect(rtcCase['_edge']['escape']).to.exist;
    expect(rtcCase['_edge']['tokenLocation']).to.exist;
    expect(rtcCase['_edge']['tokenName']).to.exist;
    expect(rtcCase['_edge']['ignoreQueryString']).to.exist;
    expect(rtcCase['_edge']['algorithm']).to.exist;
    expect(rtcCase['_edge']['method']).to.exist;
    expect(rtcCase['_edge']['key']).to.exist;


    // Encode URI for acl, url, queryString
    var pattern = /%../g;

    if (options['url'])
        options['url'] = encodeURI(options['url']);

    logger.debug("Token Options: ", options);

    // Validate token options with Remote Test Case information
    var atk = new AuthToken(options, options['verbosity']);
    var isValidTokenOptions = true;
    if (rtcCase['_edge']['escape'] !== atk.options['escapeEarly']) isValidTokenOptions = false;
    if (rtcCase['_edge']['tokenName'] !== atk.options['tokenName']) isValidTokenOptions = false;
    if (rtcCase['_edge']['algorithm'].toLowerCase() !== atk.options['algorithm'].toLowerCase()) isValidTokenOptions = false;
    if (rtcCase['_edge']['key'] !== atk.options['key']) isValidTokenOptions = false;
    if (rtcCase['_edge']['transitionKey'] && rtcCase['_edge']['transitionKey'] !== atk.options['key']) isValidTokenOptions = false;
    if (rtcCase['_edge']['salt'] && rtcCase['_edge']['salt'] !== atk.options['salt']) isValidTokenOptions = false;


    if (!isValidTokenOptions) {
        done(new Error("Token options is not match for Edge configuration"));
        return;
    }

    // prepare for request options
    var token = atk.generateToken();
    logger.debug(token);
    //var qs = rtcCase['_edge']['queryString']?encodeURIComponent(rtcCase['_edge']['queryString']) + '&' + token : token;
    //var qs = rtcCase['_edge']['queryString']?encodeURI(rtcCase['_edge']['queryString']) + '&' + token : token;
    //var qs = rtcCase['_edge']['queryString']?escape(rtcCase['_edge']['queryString']) + '&' + token : token;
    var qs = rtcCase['_edge']['queryString'] ? encodeURI(rtcCase['_edge']['queryString']) + '&' + token : token;

    var reqOptions = {
        method: rtcCase._edge.method,
        url: encodeURI(rtcCase._edge.url) + '?' + qs,
        //url: _url,
        headers: {
            pragma: 'akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-true-cache-key, akamai-x-get-extracted-values, akamai-x-get-request-id, akamai-x-get-client-ip, akamai-x-feo-trace, akamai-x-get-ssl-client-session-id, akamai-x-seria-no, akamai-x-tapioca-trace'
        }
    };

    // prepare for request object

    return {
        req: request.defaults(reqOptions),
        expect: options.expect
    };
}

function selectRtcs(rtd, rtcName) {
    var selectedTestCases = [];
    for (var index in rtcName) {
        var rtcKey = rtcName[index];
        for (var tcName in rtd[rtcKey]) {
            if (tcName !== '_edge')
                selectedTestCases.push(rtcKey + '.' + tcName);
        }
    }

    return selectedTestCases;
}

describe("Query String Test", function() {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_query.json'));

    describe("Escape [ON], Ignore QS [ON]", function() {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd, ['query_escape_ignore_method_get', 'query_escape_ignore_method_put',
            'query_escape_ignore_method_post', 'query_escape_ignore_method_delete','query_escape_ignore_acl',
            'query_escape_ignore_acl_resource' ,'query_escape_ignore_acl_resource_qs', 'query_escape_ignore_url',
            'query_escape_ignore_url_qs']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {

                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);

                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);

                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });


    describe("Escape [ON], Ignore QS [OFF]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['query_escape_method_get', 'query_escape_method_put', 'query_escape_method_post',
            'query_escape_method_delete', 'query_escape_acl', 'query_escape_acl_resource',
            'query_escape_acl_resource_qs', 'query_escape_url', 'query_escape_url_qs']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape [OFF], Ignore QS [OFF]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['query_method_get', 'query_method_put', 'query_method_post',
            'query_method_delete', 'query_acl', 'query_acl_resource',
            'query_acl_resource_qs', 'query_url', 'query_url_safechars', 'query_url_qs', 'query_url_qs_safechars']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

    describe("EEscape [OFF], Ignore QS [ON]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['query_ignore_method_get', 'query_ignore_acl', 'query_ignore_acl_resource',
            'query_ignore_acl_resource_qs', 'query_ignore_url', 'query_ignore_url']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

});

describe("MD5 Query String Test", function() {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_query.json'));

    describe("Escape [ON], Ignore QS [ON]", function() {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd, ['md5_query_escape_ignore_method_get', 'md5_query_escape_ignore_method_put',
            'md5_query_escape_ignore_method_post', 'md5_query_escape_ignore_method_delete','md5_query_escape_ignore_acl',
            'md5_query_escape_ignore_acl_resource' ,'md5_query_escape_ignore_acl_resource_qs', 'md5_query_escape_ignore_url',
            'md5_query_escape_ignore_url_qs']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {

                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);

                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);

                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });


    describe("Escape [ON], Ignore QS [OFF]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['md5_query_escape_method_get', 'md5_query_escape_method_put', 'md5_query_escape_method_post',
            'md5_query_escape_method_delete', 'md5_query_escape_acl', 'md5_query_escape_acl_resource',
            'md5_query_escape_acl_resource_qs', 'md5_query_escape_url', 'md5_query_escape_url_qs']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape [OFF], Ignore QS [OFF]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['md5_query_method_get', 'md5_query_method_put', 'md5_query_method_post',
            'md5_query_method_delete', 'md5_query_acl', 'md5_query_acl_resource',
            'md5_query_acl_resource_qs', 'md5_query_url', 'md5_query_url_safechars', 'md5_query_url_qs', 'md5_query_url_qs_safechars']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

    describe("EEscape [OFF], Ignore QS [ON]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['md5_query_ignore_method_get', 'md5_query_ignore_acl', 'md5_query_ignore_acl_resource',
            'md5_query_ignore_acl_resource_qs', 'md5_query_ignore_url', 'md5_query_ignore_url']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err) {
            if (err)
                mlogger.error(err);
        });
    });

});

/*
describe("Cookie Test", function () {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_cookie.json'));
    describe("Escape ON & Ignore ON", function () {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd,['cookie_01','cookie_02','cookie_03']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {

                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);

                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);

                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });


    describe("Escape ON & Ignore OFF", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['cookie_11','cookie_12','cookie_13']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape OFF & Ignore OFF", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['cookie_21','cookie_22','cookie_23']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape OFF & Ignore ON", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['cookie_31','cookie_32','cookie_33']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });
});


describe("Header Test", function () {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_cookie_header.json'));
    describe("Escape ON & Ignore ON", function () {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd,['header_01','header_02','header_03']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {

                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);

                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);

                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });


    describe("Escape ON & Ignore OFF", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['header_11','header_12','header_13']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape OFF & Ignore OFF", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['header_21','header_22','header_23']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });

    describe("Escape OFF & Ignore ON", function () {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd,['header_31','header_32','header_33']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);
                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);
                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });
});

describe("SALT Test", function () {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_cookie_salt.json'));
    describe("Escape ON & Ignore ON", function () {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd,['salt_01','salt_02','salt_03']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {

                var opt = makeRequest(done, rtc.split(".")[0], rtc.split(".")[1]);

                opt.req({}, function(err, res) {
                    logger.debug("RequestUrl: ", res.request.uri.href);

                    expect(res.statusCode).to.be.oneOf(opt.expect.code);
                    callback(null, done(err));
                });
            });
        }, function(err){
            if (err)
                mlogger.error(err);
        });
    });
});
*/