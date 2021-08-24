'use strict'
const crypto = require('crypto')


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
        var startTime = this.options.startTime
        var endTime = this.options.endTime

        if (typeof startTime === 'string' && startTime.toLowerCase() === 'now') {
            startTime = parseInt(Date.now() / 1000)
        } else if (startTime) {
            if (typeof startTime === 'number' && startTime <= 0) {
                throw new Error('startTime must be number ( > 0 ) or "now"')
            }
        }

        if (typeof endTime === 'number' && endTime <= 0) {
            throw new Error('endTime must be number ( > 0 )')
        }

        if (typeof this.options.windowSeconds === 'number' && this.options.windowSeconds <= 0) {
            throw new Error('windowSeconds must be number( > 0 )')
        }

        if (!endTime) {
            if (this.options.windowSeconds) {
                if (!startTime) {
                    startTime = parseInt(Date.now() / 1000)
                } 
                endTime = parseInt(startTime) + parseInt(this.options.windowSeconds)
            } else {
                throw new Error('You must provide endTime or windowSeconds')
            }
        }

        if (startTime && (endTime < startTime)) {
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
            console.log("    Start Time      : " + startTime)
            console.log("    Window(seconds) : " + this.options.windowSeconds)
            console.log("    End Time        : " + endTime)
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
            newToken.push("st=" + startTime)
        }
        newToken.push("exp=" + endTime)

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

        this.options.algorithm = this.options.algorithm.toString().toLowerCase()        
        if (!(this.options.algorithm == 'sha256' || this.options.algorithm == 'sha1' || this.options.algorithm == 'md5')) {
            throw new Error('altorithm should be sha256 or sha1 or md5')
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

module.exports = { EdgeAuth };
