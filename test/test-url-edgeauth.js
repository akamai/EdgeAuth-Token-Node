'use strict'
const assert = require('assert')
const http = require('http')
const fs = require('fs')
const util = require('util')
const { EdgeAuth } = require('../lib/edgeauth')
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
// URL TEST
// ********
describe(`URL | Escape Token (O) | Ignore QueryString (O)`, function() {
	it('/q_escape_ignore', function(done) {
		var args = {
			path: '/q_escape_ignore',
			authpath: '/q_escape_ignore',
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore', function(done) {
		var args = {
			path: '/c_escape_ignore',
			authpath: '/c_escape_ignore',
			escapeEarly: true, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore', function(done) {
		var args = {
			path: '/h_escape_ignore',
			authpath: '/h_escape_ignore',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/q_escape_ignore?hello=world&안녕=세상', function(done) {
		var args = {
			path: '/q_escape_ignore?hello=world' + encodeURIComponent("&안녕=세상"),
			authpath: '/q_escape_ignore',
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore?hello=world&안녕=세상', function(done) {
		var args = {
			path: "/c_escape_ignore?hello=world&안녕=세상",
			authpath: '/c_escape_ignore',
			escapeEarly: true, 
			isUrl: true
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore?hello=world', function(done) {
		var args = {
			path: '/h_escape_ignore?hello=world',
			authpath: '/h_escape_ignore',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/q_escape_ignore transitionKey', function(done) {
		var args = {
			path: '/q_escape_ignore',
			authpath: '/q_escape_ignore',
			transition: transitionKey,
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore transitionKey', function(done) {
		var args = {
			path: '/c_escape_ignore',
			authpath: '/c_escape_ignore',
			transition: transitionKey,
			escapeEarly: true, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore transitionKey', function(done) {
		var args = {
			path: '/h_escape_ignore',
			authpath: '/h_escape_ignore',
			transition: transitionKey,
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})

	it('/q_escape_ignore payload', function(done) {
		var args = {
			path: '/q_escape_ignore',
			authpath: '/q_escape_ignore',
			payload: 'SOME_PAYLOAD_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore payload', function(done) {
		var args = {
			path: '/c_escape_ignore',
			authpath: '/c_escape_ignore',
			payload: 'SOME_PAYLOAD_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore payload', function(done) {
		var args = {
			path: '/h_escape_ignore',
			authpath: '/h_escape_ignore',
			payload: 'SOME_PAYLOAD_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/q_escape_ignore sessionId', function(done) {
		var args = {
			path: '/q_escape_ignore',
			authpath: '/q_escape_ignore',
			sessionId: 'SOME_SESSION_ID_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape_ignore sessionId', function(done) {
		var args = {
			path: '/c_escape_ignore',
			authpath: '/c_escape_ignore',
			sessionId: 'SOME_SESSION_ID_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape_ignore sessionId', function(done) {
		var args = {
			path: '/h_escape_ignore',
			authpath: '/h_escape_ignore',
			sessionId: 'SOME_SESSION_ID_DATA',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`URL | Escape Token (X) | Ignore QueryString (O)`, function() {
	it('/q_ignore', function(done) {
		var args = {
			path: '/q_ignore',
			authpath: '/q_ignore',
			escapeEarly: false, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_ignore', function(done) {
		var args = {
			path: '/c_ignore',
			authpath: '/c_ignore',
			escapeEarly: false, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_ignore?안녕=세상', function(done) {
		var args = {
			path: '/h_ignore?안녕=세상',
			authpath: '/h_ignore',
			escapeEarly: false, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`URL | Escape Token (O) | Ignore QueryString (X)`, function() {
	it('/q_escape?' + encodeURIComponent("안녕=세상"), function(done) {
		var args = {
			path: '/q_escape?' + encodeURIComponent("안녕=세상"),
			authpath: '/q_escape?' + encodeURIComponent("안녕=세상"),
			escapeEarly: true, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c_escape', function(done) {
		var args = {
			path: '/c_escape',
			authpath: '/c_escape',
			escapeEarly: true, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h_escape', function(done) {
		var args = {
			path: '/h_escape',
			authpath: '/h_escape',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/h_escape?안녕=세상', function(done) {
		var args = {
			path: '/h_escape?안녕=세상',
			authpath: '/h_escape?안녕=세상',
			escapeEarly: true, 
			isUrl: true 
		}
		headerAssertEqual(args, (statusCode) => {
			expect(403).to.equal(statusCode)
			return done()
	  	})
	})
})


describe(`URL | Escape Token (X) | Ignore QueryString (X)`, function() {
	it('/q?' + encodeURIComponent("안녕=세상"), function(done) {
		var args = {
			path: '/q?' + encodeURIComponent("안녕=세상"),
			authpath: '/q?' + encodeURIComponent("안녕=세상"),
			escapeEarly: false, 
			isUrl: true 
		}
		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
	it('/c', function(done) {
		var args = {
			path: '/c',
			authpath: '/c',
			escapeEarly: false, 
			isUrl: true 
		}
		cookieAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
		})
	})
	it('/h', function(done) {
		var args = {
			path: '/h',
			authpath: '/h',
			escapeEarly: false,
			isUrl: true 
		}

		headerAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`URL | SALT | Escape Token (O) | Ignore QueryString (O)`, function() {
	it('/salt', function(done) {
		var args = {
			path: '/salt',
			authpath: '/salt',
			escapeEarly: true, 
			isUrl: true,
			salt: salt
		}

		queryAssertEqual(args, (statusCode) => {
			expect(404).to.equal(statusCode)
			return done()
	  	})
	})
})

describe(`Time Test`, function() {
	it('Time Test', function(done) {
		var ea = new EdgeAuth({
			key: encryptionKey,
			windowSeconds: DEFAULT_WINDOW_SECOND,
		})
		ea.generateURLToken("/")
		expect(undefined).to.equal(ea.start_time)
		expect(undefined).to.equal(ea.end_time)

		return done()
	})
})



