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

//var rtd = {};

/**
 * Make request object
 * @param done mocha done callback
 * @param rtcCaseName (string) Remote Test Case Name in test_remote_xxx.json file. ex) 'rtc1'
 * @param optionsName (string) Remote Test Case token options name in test_remote_xxx.json file. ex) 'a'
 * @returns {request} request object
 */
function makeRequest(rtd, done, rtcCaseName, optionsName) {
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
    var qs = rtcCase['_edge']['queryString'] ? encodeURI(rtcCase['_edge']['queryString']) : '';

    var reqOptions = {
        method: rtcCase._edge.method,
        url: qs === '' ? encodeURI(rtcCase._edge.url) : encodeURI(rtcCase._edge.url) + '?' + qs,
        headers: {
            pragma: 'akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-true-cache-key, akamai-x-get-extracted-values, akamai-x-get-request-id, akamai-x-get-client-ip, akamai-x-feo-trace, akamai-x-get-ssl-client-session-id, akamai-x-seria-no, akamai-x-tapioca-trace'
        }
    };


    // Token Location : Query String, Cookie, Header manipulation
        if (rtcCase['_edge']['tokenLocation'].toLowerCase() == 'query')
            reqOptions.url += rtcCase['_edge']['queryString']? '&' + token : '?' + token;
        else if (rtcCase['_edge']['tokenLocation'].toLowerCase() == 'cookie')
            reqOptions.headers['Cookie'] = token;
        else if (rtcCase['_edge']['tokenLocation'].toLowerCase() == 'header')
            reqOptions.headers[atk.options['tokenName']] = atk.options['tokenValue'];

    logger.debug('[Request Options]', reqOptions);

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
    var rtd = JSON.parse(fs.readFileSync('./test/test_remote_query.json'));

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

                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);

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
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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

    describe("Escape [OFF], Ignore QS [ON]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['query_ignore_method_get', 'query_ignore_acl', 'query_ignore_acl_resource',
            'query_ignore_acl_resource_qs', 'query_ignore_url', 'query_ignore_url']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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

describe("Cookie Test", function() {
    var rtd = JSON.parse(fs.readFileSync('./test/test_remote_cookie.json'));

    describe("Escape [ON], Ignore QS [ON]", function() {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd, ['cookie_escape_ignore_method_get', 'cookie_escape_ignore_acl',
            'cookie_escape_ignore_acl_resource', 'cookie_escape_ignore_acl_resource_qs','cookie_escape_ignore_url',
            'cookie_escape_ignore_url_qs']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {

                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);

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
        var selectedRtcs = selectRtcs(rtd, ['cookie_escape_method_get', 'cookie_escape_acl', 'cookie_escape_acl_resource',
            'cookie_escape_acl_resource_qs', 'cookie_escape_url', 'cookie_escape_url_qs']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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
        var selectedRtcs = selectRtcs(rtd, ['cookie_method_get', 'cookie_acl', 'cookie_acl_resource',
            'cookie_acl_resource_qs', 'cookie_url', 'cookie_url_safechars',
            'cookie_url_qs', 'cookie_url_qs_safechars']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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

    describe("Escape [OFF], Ignore QS [ON]", function() {
        this.timeout(10000);
        var selectedRtcs = selectRtcs(rtd, ['cookie_ignore_method_get', 'cookie_ignore_acl', 'cookie_ignore_acl_resource',
            'cookie_ignore_acl_resource_qs', 'cookie_ignore_url', 'cookie_url_ignore_safechars','cookie_ignore_url_qs',
            'cookie_url_ignore_qs_safechars']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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

describe("Header Test", function () {
    rtd = JSON.parse(fs.readFileSync('./test/test_remote_header.json'));
    describe("Escape ON & Ignore ON", function () {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd,['header_escape_ignore_method_get','header_escape_ignore_acl','header_escape_ignore_acl_resource'
        ,'header_escape_ignore_acl_resource_qs', 'header_escape_ignore_url', 'header_escape_ignore_url_qs']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {

                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);

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
        var selectedRtcs = selectRtcs(rtd,['header_escape_method_get','header_escape_acl','header_escape_acl_resource'
        ,'header_escape_acl_resource_qs', 'header_escape_url', 'header_escape_url_qs', 'header_escape_url_qs_safechar']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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
        var selectedRtcs = selectRtcs(rtd,['header_method_get','header_acl','header_acl_resource'
        ,'header_acl_resource_qs', 'header_url', 'header_url_safechars', 'header_url_qs']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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
        var selectedRtcs = selectRtcs(rtd,['header_ignore_method_get','header_ignore_acl','header_ignore_acl_resource'
        ,'header_ignore_acl_resource_qs', 'header_ignore_url', 'header_url_ignore_safechars', 'header_ignore_url_qs'
        ,'header_url_ignore_qs_safechars']);

        //var selectedRtcs = selectRtcs(rtd,['rtc13']);
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function (done) {
                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);
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

describe("SALT Test", function() {
    var rtd = JSON.parse(fs.readFileSync('./test/test_remote_salt.json'));

    describe("Escape [ON], Ignore QS [ON]", function() {
        this.timeout(10000);

        // Select whole test cases under each Rtcs
        var selectedRtcs = selectRtcs(rtd, ['salt_escape_ignore_method_get', 'salt_escape_ignore_acl',
            'salt_escape_ignore_acl_resource', 'salt_escape_ignore_acl_resource_qs','salt_escape_ignore_url',
            'salt_escape_ignore_url_qs']);

        //async.mapLimit(selectedRtcs,5, function(rtc, callback) {
        async.map(selectedRtcs, function(rtc, callback) {
            it(rtc, function(done) {

                var opt = makeRequest(rtd, done, rtc.split(".")[0], rtc.split(".")[1]);

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