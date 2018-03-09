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

module.exports = EdgeAuth