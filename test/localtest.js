/**
 * Created by shan on 4/17/17.
 */

var expect = require('chai').expect
    ,AuthToken = require('../lib/akamai/authtoken/authtoken.js')
    ,request = require('request')
    ,fs = require('fs');

var ltd = JSON.parse(fs.readFileSync('./test/test_data.json'));
ltd = ltd['local'];

describe("AuthToken Local Hmac Validation Test", function() {
    describe("Valid options validation test", function() {
        it("Valid #1" , function() {
            var atk = new AuthToken(ltd.not_throw1.options);
            expect(atk.generateToken).to.not.throw();
        });
        it("Valid #2", function() {
            var atk = new AuthToken(ltd.not_throw2.options);
            expect(atk.generateToken).to.not.throw();
        });
        it("Valid #3", function() {
            var atk = new AuthToken(ltd.not_throw3.options);
            expect(atk.generateToken).to.not.throw();
        });
        it("Valid #4", function() {
            var atk = new AuthToken(ltd.not_throw4.options);
            expect(atk.generateToken).to.not.throw();
        });
    });

    describe("Invalid options validation test", function() {
        it("Invalid #1" , function() {
            var atk = new AuthToken(ltd.throw1.options);
            expect(atk.generateToken).to.throw();
        });
        it("Invalid #2" , function() {
            var atk = new AuthToken(ltd.throw2.options);
            expect(atk.generateToken).to.throw();
        });
        it("Invalid #3" , function() {
            var atk = new AuthToken(ltd.throw3.options);
            expect(atk.generateToken).to.throw();
        });
        it("Invalid #4" , function() {
            var atk = new AuthToken(ltd.throw4.options);
            expect(atk.generateToken).to.throw();
        });

    });

    describe("Token Validation Test", function() {
        it("default", function() {
            var atk = new AuthToken(ltd.atk1.options);
            expect(atk.generateToken()).to.equal(ltd.atk1.result.token);
        });
        it("windowSeconds", function() {
            var atk = new AuthToken(ltd.atk2.options);
            expect(atk.generateToken()).to.equal(ltd.atk2.result.token);
        });
        it("multiple ACLs", function() {
            var atk = new AuthToken(ltd.atk3.options);
            expect(atk.generateToken()).to.equal(ltd.atk3.result.token);
        });
        it("endTime", function() {
            var atk = new AuthToken(ltd.atk4.options);
            expect(atk.generateToken()).to.equal(ltd.atk4.result.token);
        });
        it("url", function() {
            var atk = new AuthToken(ltd.atk5.options);
            expect(atk.generateToken()).to.equal(ltd.atk5.result.token);
        });
        it("sessionId", function() {
            var atk = new AuthToken(ltd.atk6.options);
            expect(atk.generateToken()).to.equal(ltd.atk6.result.token);
        });
        it("ipAddress", function() {
            var atk = new AuthToken(ltd.atk7.options);
            expect(atk.generateToken()).to.equal(ltd.atk7.result.token);
        });
        it("payload", function() {
            var atk = new AuthToken(ltd.atk8.options);
            expect(atk.generateToken()).to.equal(ltd.atk8.result.token);
        });
        it("salt", function() {
            var atk = new AuthToken(ltd.atk9.options);
            expect(atk.generateToken()).to.equal(ltd.atk9.result.token);
        });
        it("delimiter", function() {
            var atk = new AuthToken(ltd.atk10.options);
            expect(atk.generateToken()).to.equal(ltd.atk10.result.token);
        });
        it("escapeEarly", function() {
            var atk = new AuthToken(ltd.atk11.options);
            expect(atk.generateToken()).to.equal(ltd.atk11.result.token);
        });
        it("escapeEarlyUpper", function() {
            var atk = new AuthToken(ltd.atk12.options);
            expect(atk.generateToken()).to.equal(ltd.atk12.result.token);
        });
        it("Hmac MD5", function() {
            var atk = new AuthToken(ltd.atk13.options);
            expect(atk.generateToken()).to.equal(ltd.atk13.result.token);
        });
        it("Hmac SHA1", function() {
            var atk = new AuthToken(ltd.atk14.options);
            expect(atk.generateToken()).to.equal(ltd.atk14.result.token);
        });
    });

    describe("Hmac Algorithm Test", function() {

    });
});


