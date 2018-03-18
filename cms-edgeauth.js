'use strict'
const crypto = require('crypto')
const program = require('commander');

////////////////////////
// START lib/edgeauth.js
////////////////////////
class EdgeAuth {
    constructor(options) {
        this.options = options

        if (!this.options.tokenName) {
            this.options.tokenName = '__token__'
        }

        if (!this.options.key) {
            throw new Error('key must be provided to generate a token.')
        }

        if (this.options.algorithm === undefined) {
            this.options.algorithm = 'sha256'
        } else {
            this.options.algorithm =
                this.options.algorithm.toString().toLowerCase()
                
            if (!(this.options.algorithm == 'sha256' || this.options.algorithm == 'sha1' || this.options.algorithm == 'md5')) {
                throw new Error('altorithm should be sha256 or sha1 or md5')
            }
        }        

        if (this.options.escapeEarly === undefined) {
            this.options.escapeEarly = false
        }

        if (!this.options.fieldDelimiter) {
            this.options.fieldDelimiter = '~'
        }

        if (!this.options.aclDelimiter) {
            this.options.aclDelimiter = '!'
        }

        if (this.options.verbose === undefined) {
            this.options.verbose = false
        }
    }

    _escapeEarly(text) {
        if (this.options.escapeEarly) {
            text = encodeURIComponent(text)
                .replace(/[~'*]/g, 
                    function(c) {
                        return '%' + c.charCodeAt(0).toString(16)
                    }
                )
            var pattern = /%../g
            text = text.replace(pattern, function(match) {
                return match.toLowerCase()
            })
        } 
        return text
    }

    _generateToken(path, isUrl) {
        if (typeof this.options.startTime === 'string' && this.options.startTime.toLowerCase() === 'now') {
            this.options.startTime = ((Date.now() / 1000) | 0)
        } else if (this.options.startTime) {
            if (typeof startTime === 'number' && this.options.startTime <= 0) {
                throw new Error('startTime must be number ( > 0 ) or "now"')
            }
        }

        if (typeof this.options.endTime === 'number' && this.options.endTime <= 0) {
            throw new Error('endTime must be number ( > 0 )')
        }

        if (typeof this.options.windowSeconds === 'number' && this.options.windowSeconds <= 0) {
            throw new Error('windowSeconds must be number( > 0 )')
        }

        if (!this.options.endTime) {
            if (this.options.windowSeconds) {
                if (!this.options.startTime) {
                    this.options.endTime = ((Date.now() / 1000) | 0) + this.options.windowSeconds
                } else {
                    this.options.endTime = this.options.startTime + this.options.windowSeconds
                }
            } else {
                throw new Error('You must provide endTime or windowSeconds')
            }
        }

        if (this.options.startTime && (this.options.endTime < this.options.startTime)) {
            throw new Error('Token will have already expired')
        }

        if (this.options.verbose) {
            console.log("Akamai Token Generation Parameters")
            
            if (isUrl) {
                console.log("    URL         : " + path)
            } else {
                console.log("    ACL         : " + path)
            }

            console.log("    Token Type      : " + this.options.tokenType)
            console.log("    Token Name      : " + this.options.tokenName)
            console.log("    Key/Secret      : " + this.options.key)
            console.log("    Algo            : " + this.options.algorithm)
            console.log("    Salt            : " + this.options.salt)
            console.log("    IP              : " + this.options.ip)
            console.log("    Payload         : " + this.options.payload)
            console.log("    Session ID      : " + this.options.sessionId)
            console.log("    Start Time      : " + this.options.startTime)
            console.log("    Window(seconds) : " + this.options.windowSeconds)
            console.log("    End Time        : " + this.options.endTime)
            console.log("    Field Delimiter : " + this.options.fieldDelimiter)
            console.log("    ACL Delimiter   : " + this.options.aclDelimiter)
            console.log("    Escape Early    : " + this.options.escapeEarly)
        }

        var hashSource = []
        var newToken = []

        if (this.options.ip) {
            newToken.push("ip=" + this._escapeEarly(this.options.ip))
        }

        if (this.options.startTime) {
            newToken.push("st=" + this.options.startTime)
        }
        newToken.push("exp=" + this.options.endTime)

        if (!isUrl) {
            newToken.push("acl=" + path)
        }

        if (this.options.sessionId) {
            newToken.push("id=" + this._escapeEarly(this.options.sessionId))
        }

        if (this.options.payload) {
            newToken.push("data=" + this._escapeEarly(this.options.payload))
        }

        hashSource = newToken.slice()

        if (isUrl) {
            hashSource.push("url=" + this._escapeEarly(path))
        }

        if (this.options.salt) {
            hashSource.push("salt=" + this.options.salt)
        }
                
        var hmac = crypto.createHmac(
            this.options.algorithm, 
            new Buffer(this.options.key, 'hex')
        )

        hmac.update(hashSource.join(this.options.fieldDelimiter))
        newToken.push("hmac=" + hmac.digest('hex'))
                
        return newToken.join(this.options.fieldDelimiter)
    }

    generateACLToken(acl) {
        if (!acl) {
            throw new Error('You must provide acl')
        } else if(acl.constructor == Array) {
            acl = acl.join(this.options.aclDelimiter)
        }

        return this._generateToken(acl, false)
    }

    generateURLToken(url) {
        if (!url) {
            throw new Error('You must provide url')
        }
        return this._generateToken(url, true)
    }
}
////////////////////////
// END lib/edgeauth.js
////////////////////////

program
	.version('0.1.1')
	.option('-t, --token_type [value]', 'Select a preset. (Not Supported Yet)')
	.option('-n, --token_name [value]', 'Parameter name for the new token. [Default: __token__]')
	.option('-k, --key [value]', 'Secret required to generate the token. It must be hexadecimal digit string with even-length.')
	.option('-A, --algo [value]', 'Algorithm to use to generate the token. (sha1, sha256, or md5) [Default:sha256]')
	.option('-S, --salt [value]', 'Additional data validated by the token but NOT included in the token body.')
	.option('-s, --start_time [value]', "What is the start time? (Use 'now' for the current time)")
	.option('-e, --end_time <n>', 'When does this token expire? --end_time overrides --window')
	.option('-w, --window <n>', 'How long is this token valid for?')
	.option('-d, --field_delimiter [value]', 'Character used to delimit token body fields. [Default:~]')
	.option('-D, --acl_delimiter [value]', 'Character used to delimit acl fields. [Default:!]')
	.option('-x, --escape_early', 'Causes strings to be url encoded before being used.')
	.option('-v, --verbose', 'Print all arguments.')
	.option('-u, --url [value]', 'URL path. [Used for:URL]')
	.option('-a, --acl [value]', 'Access control List delimited by ! [ie. /*]')
	.option('-i, --ip [value]', 'IP Address to restrict this token to. IP Address to restrict this token to (Troublesome in many cases (roaming, NAT, etc) so not often used)')
	.option('-p, --payload [value]', 'Additional text added to the calculated digest.')
	.option('-I, --session_id [value]', 'The session identifier for single use tokens or other advanced cases.')
	.parse(process.argv);

var ea = new EdgeAuth({
	tokenType: program.token_type,
	tokenName: program.token_name,
	key: program.key,
	algorithm: program.algo,
	salt: program.salt,
	startTime: program.start_time,
	endTime: program.end_time,
	windowSeconds: program.window,
	fieldDelimiter: program.field_delimiter,
	aclDelimiter: program.acl_delimiter,
	escapeEarly: program.escape_early,
	verbose: program.verbose,
	url: program.url,
	acl: program.acl,
	ip: program.ip,
	payload: program.payload,
	sessionId: program.session_id
})


var token
if (program.acl) {
	token = ea.generateACLToken(program.acl)
} else { // program.url
	token = ea.generateURLToken(program.url)
}

console.log("### Cookie or Query String ###")
console.log(`${ea.options.tokenName}=${token}`)
console.log("### Header ###")
console.log(`${ea.options.tokenName}: ${token}`)
