'use strict'
const assert = require('assert')
const http = require('http')
const fs = require('fs')
const util = require('util')
const EdgeAuth = require('./../lib/edgeAuth')
const expect = require('chai').expect

const DEFAULT_WINDOW_SECOND = 10

var hostname
var encryptionKey
var transitionKey
var salt

if (process.env.TEST_MODE == 'TRAVIS') {
	hostname = process.env.EA_HOSTNAME
	encryptionKey = process.env.EA_ENCRYPTION_KEY
	transitionKey = process.env.EA_TRANSITION_KEY
	salt = process.env.EA_SALT
} else {
	var localTest = JSON.parse(fs.readFileSync(__dirname + '/edgeauth-options.json'))
	hostname = localTest['EA_HOSTNAME']
	encryptionKey = localTest['EA_ENCRYPTION_KEY']
	transitionKey = localTest['EA_TRANSITION_KEY']
	salt = localTest['EA_SALT']
}

// Test for Querty String (sha256: default)
var ea = new EdgeAuth({
	key: encryptionKey,
	windowSeconds: DEFAULT_WINDOW_SECOND,
})
// Test for Cookie (sha1)
var cea = new EdgeAuth({
	key: encryptionKey,
	windowSeconds: DEFAULT_WINDOW_SECOND,
	algorithm: 'sha1'
})
// Test for Header (md5)
var hea = new EdgeAuth({
	key: encryptionKey,
	windowSeconds: DEFAULT_WINDOW_SECOND,
	algorithm: 'md5'
})

// ***************************************
// Functions to test (change object value)
// ***************************************
function tokenSetting(ttype, escapeEarly, transition, payload, sessionId, salt) {
	var t
	if (ttype == 'q') 
		t = ea
	else if (ttype == 'c')
		t = cea
	else if (ttype == 'h')
		t = hea

	if (transition)
		t.options.key = transitionKey

	if (payload)
		t.options.payload = payload

	if (sessionId)
		t.options.sessionId = sessionId

	if (salt)
		t.options.salt = salt

	t.options.escapeEarly = escapeEarly
}

function makeRequest(options, callback) {
	var request = http.request(options, (res) => {
		callback(res.statusCode)
	})
	request.on('error', (err) => {
      callback(err)
    })
    request.end()
}

function queryAssertEqual(args, callback) {
	tokenSetting('q', args.escapeEarly, args.transition, args.payload, args.sessionId, args.salt)
	var token
	if (args.isUrl)
		token = ea.generateURLToken(args.authpath)
	else
		token = ea.generateACLToken(args.authpath)
	var qsSymbol = (args.path.indexOf('?') > -1) ? '&' : '?'
	var path = util.format("%s%s%s=%s", args.path, qsSymbol, ea.options.tokenName, token)
	var options = {
		method: 'GET',
		host: hostname,
		path: path
	}
	return makeRequest(options, callback)
}
function cookieAssertEqual(args, callback) {
	tokenSetting('c', args.escapeEarly, args.transition, args.payload, args.sessionId, args.salt)
	var token
	if (args.isUrl)
		token = cea.generateURLToken(args.authpath)
	else
		token = cea.generateACLToken(args.authpath)
	var options = {
		method: 'GET',
		host: hostname,
		path: args.path,
		headers: {
			'Cookie': util.format("%s=%s", cea.options.tokenName, token)
		}
	}
	return makeRequest(options, callback)
}
function headerAssertEqual(args, callback) {
	tokenSetting('h', args.escapeEarly, args.transition, args.payload, args.sessionId, args.salt)
	var token
	if (args.isUrl)
		token = hea.generateURLToken(args.authpath)
	else
		token = hea.generateACLToken(args.authpath)

	var options = {
		method: 'GET',
		host: hostname,
		path: args.path,
		headers: {
			[hea.options.tokenName]: token
		}
	}
	return makeRequest(options, callback)
}

// ********
// ACL TEST
// ********
describe(`ACL | Escape Token (O) | Ignore QueryString (O)`, function() {
	it('/q_escape_ignore/something', function(done) {
			var args = {
				path: '/q_escape_ignore/something',
				authpath: '/q_escape_ignore/*',
				isUrl: false,
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore/something?hello=world', function(done) {
			var args = {
				path: '/c_escape_ignore/something?hello=world',
				authpath: '/c_escape_ignore/*',
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore/something?hello=world', function(done) {
			var args = {
				path: '/h_escape_ignore/something?hello=world',
				authpath: '/h_escape_ignore/*',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/q_escape_ignore/something?hello=world' + encodeURIComponent("&안녕=세상"), function(done) {
			var args = {
				path: '/q_escape_ignore/something?hello=world' + encodeURIComponent("&안녕=세상"),
				authpath: '/q_escape_ignore/*',
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it("/c_escape_ignore/something?hello=world&안녕=세상", function(done) {
			var args = {
				path: "/c_escape_ignore/something?hello=world&안녕=세상",
				authpath: '/c_escape_ignore/*',
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore/something?hello=world', function(done) {
			var args = {
				path: '/h_escape_ignore/something?hello=world',
				authpath: '/h_escape_ignore/*',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/q_escape_ignore/something transitionKey', function(done) {
			var args = {
				path: '/q_escape_ignore/something',
				authpath: '/q_escape_ignore/*',
				transition: transitionKey,
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore/something transitionKey', function(done) {
			var args = {
				path: '/c_escape_ignore/something',
				authpath: '/c_escape_ignore/*',
				transition: transitionKey,
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore/something transitionKey', function(done) {
			var args = {
				path: '/h_escape_ignore/something',
				authpath: '/h_escape_ignore/*',
				transition: transitionKey,
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/q_escape_ignore/something payload', function(done) {
			var args = {
				path: '/q_escape_ignore/something',
				authpath: '/q_escape_ignore/*',
				payload: 'SOME_PAYLOAD_DATA',
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore/something payload', function(done) {
			var args = {
				path: '/c_escape_ignore/something',
				authpath: '/c_escape_ignore/*',
				payload: 'SOME_PAYLOAD_DATA',
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore/something payload', function(done) {
			var args = {
				path: '/h_escape_ignore/something',
				authpath: '/h_escape_ignore/*',
				payload: 'SOME_PAYLOAD_DATA',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/q_escape_ignore/something sessionId', function(done) {
			var args = {
				path: '/q_escape_ignore/something',
				authpath: '/q_escape_ignore/*',
				sessionId: 'SOME_SESSION_ID_DATA',
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore/something sessionId', function(done) {
			var args = {
				path: '/c_escape_ignore/something',
				authpath: '/c_escape_ignore/*',
				sessionId: 'SOME_SESSION_ID_DATA',
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore/something sessionId', function(done) {
			var args = {
				path: '/h_escape_ignore/something',
				authpath: '/h_escape_ignore/*',
				sessionId: 'SOME_SESSION_ID_DATA',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`ACL | Escape Token (X) | Ignore QueryString (O)`, function() {
	it('/q_ignore/something?hello=world', function(done) {
			var args = {
				path: '/q_ignore/something?hello=world',
				authpath: '/q_ignore/*',
				escapeEarly: false, 
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c/something_ignore', function(done) {
			var args = {
				path: '/c_ignore/something',
				authpath: '/c_ignore/*',
				escapeEarly: false, 
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/something?안녕=세상/h_ignore?안녕=세상', function(done) {
			var args = {
				path: '/h_ignore/something?안녕=세상',
				authpath: '/h_ignore/*',
				escapeEarly: false, 
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`ACL | Escape Token (O) | Ignore QueryString (X)`, function() {
	it('/q_escape/something?' + encodeURIComponent("안녕=세상"), function(done) {
			var args = {
				path: '/q_escape/something?' + encodeURIComponent("안녕=세상"),
				authpath: '/q_escape/*',
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c/something_escape', function(done) {
			var args = {
				path: '/c_escape/something',
				authpath: '/c_escape/*',
				escapeEarly: false,
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h/something_escape', function(done) {
			var args = {
				path: '/h_escape/something',
				authpath: '/h_escape/*',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/something?안녕=세상/h_escape?안녕=세상', function(done) {
			var args = {
				path: '/h_escape/something?안녕=세상',
				authpath: '/h_escape/*',
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})


describe(`ACL | Escape Token (X) | Ignore QueryString (X)`, function() {
	it('/q/something?' + encodeURIComponent("안녕=세상"), function(done) {
			var args = {
				path: '/q/something?' + encodeURIComponent("안녕=세상"),
				authpath: '/q/something?' + encodeURIComponent("안녕=세상"),
				escapeEarly: false, 
				isUrl: false 
			}
			queryAssertEqual(args, (statusCode) => {
			expect(403).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c/something', function(done) {
			var args = {
				path: '/c/something?hello=world',
				authpath: '/c/*',
				escapeEarly: false, 
				isUrl: false 
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h/so', function(done) {
			var args = {
				path: '/h/so',
				authpath: '/h/??',
				escapeEarly: false,
				isUrl: false 
			}
			headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})


describe(`ACL | SALT | Escape Token (O) | Ignore QueryString (O)`, function() {
	it('/salt/something', function(done) {
			var args = {
				path: '/salt/something',
				authpath: '/salt/*',
				isUrl: false,
				salt: salt
			}
			queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})


describe(`ACL Delimiter Test`, function() {

	var arr = ['/c_escape_ignore/?', '/c_escape_ignore/??', '/c_escape_ignore/hello']

	it('/c_escape_ignore/?', function(done) {
			var args = {
				path: '/c_escape_ignore/1',
				authpath: arr,
				isUrl: false,
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/c_escape_ignore/??', function(done) {
			var args = {
				path: '/c_escape_ignore/12',
				authpath: arr,
				isUrl: false,
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/c_escape_ignore/hello', function(done) {
			var args = {
				path: '/c_escape_ignore/hello',
				authpath: arr,
				isUrl: false,
			}
			cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})
// In ACL, do not use query string because it uses '?', '*'.