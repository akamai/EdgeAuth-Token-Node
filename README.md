# EdgeAuth-Token-Node: Akamai Edge Authorization Token for Node

[![npm package](https://badge.fury.io/js/akamai-edgeauth.svg)](https://badge.fury.io/js/akamai-edgeauth)
[![Build Status](https://travis-ci.org/akamai/EdgeAuth-Token-Node.svg?branch=master)](https://travis-ci.org/akamai/EdgeAuth-Token-Node)
[![License](http://img.shields.io/:license-apache-blue.svg)](https://github.com/akamai/EdgeAuth-Token-Node/blob/master/LICENSE)

[![npm package](https://nodei.co/npm/akamai-edgeauth.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/akamai-edgeauth/)

EdgeAuth-Token-Node is Akamai Edge Authorization Token in the HTTP Cookie, Query String and Header for a client.
You can configure it in the Property Manager at https://control.akamai.com.
It's the behaviors which is Auth Token 2.0 Verification and Segmented Media Protection.

EdgeAuth-Token-Node supports for Node.js 4.0+

<div style="text-align:center"><img src=https://github.com/AstinCHOI/akamai-asset/blob/master/edgeauth/edgeauth.png?raw=true/></div>


## Installation

To install Akamai Edge Authorization Token with npm:  

```Shell
$ npm install akamai-edgeauth --save
```
  

## Example

```Javascript
const EdgeAuth = require('akamai-edgeauth')
const http = require('http') // Module for the test


var EA_HOSTNAME = 'edgeauth.akamaized.net'
var EA_ENCRYPTION_KEY = 'YourEncryptionKey' 
var DURATION = 500 // seconds


// Function just for the simple test
function makeRequest(options, callback) {
    var request = http.request(options, (res) => {
        callback(res)
    })
    request.on('error', (err) => {
        callback(err)
    })
    request.end()
}
```
* EA_ENCRYPTION_KEY must be hexadecimal digit string with even-length.  
* Don't expose EA_ENCRYPTION_KEY on the public repository.  


#### URL parameter option

```Javascript
// [EXAMPLE 1] Cookie
var ea = new EdgeAuth({
    key: EA_ENCRYPTION_KEY,
    windowSeconds: DURATION,
    escapeEarly: true
})
var token = ea.generateURLToken("/akamai/edgeauth")
var options = {
    hostname: EA_HOSTNAME,
    path: '/akamai/edgeauth',
    'Cookie': `${ea.options.tokenName}=${token}`
}
makeRequest(options, function(res) {
    console.log(res.statusCode) // If pass, it won't response 403 code.
})

// [EXAMPLE 2] Query string
token = ea.generateURLToken("/akamai/edgeauth")
options = {
    hostname: EA_HOSTNAME,
    path: `/akamai/edgeauth?${ea.options.tokenName}=${token}`
}
makeRequest(options, function(res) {
    console.log(res.statusCode)
})
```
* 'Escape token input' option in the Property Manager corresponds to 'escapeEarly' in the code.  
Escape token input (on) == escapeEarly (true)  
Escape token input (off) == escapeEarly (false)  

* In [Example 2] for Query String, it's only okay for 'Ignore query string' option (on).
* If you want to 'Ignore query string' option (off) using query string as your token, Please contact your Akamai representative.  


#### ACL(Access Control List) parameter option

```Javascript
// [EXAMPLE 1] Header using *
var ea = new EdgeAuth({
    key: EA_ENCRYPTION_KEY,
    windowSeconds: DURATION,
    escapeEarly: false
})
var token = ea.generateURLToken("/akamai/edgeauth/*")
var options = {
    hostname: EA_HOSTNAME,
    path: "/akamai/edgeauth/something",
    headers: {[ea.options.tokenName]: token}
}
makeRequest(options, function(res) {
    console.log(res.statusCode)
})


// [EXAMPLE 2] Cookie using ACL delimiter
var ea = new EdgeAuth({
    key: EA_ENCRYPTION_KEY,
    windowSeconds: DURATION,
    escapeEarly: false
})
var acl = ["/akamai/edgeauth/??", "/akamai/edgeauth/list/*"]
var token = ea.generateURLToken(acl)
var options = {
    hostname: EA_HOSTNAME,
    path: "/akamai/edgeauth/22",
    Cookie: `${ea.options.tokenName}: ${token}`
}
makeRequest(options, function(res) {
    console.log(res.statusCode)
})

```
* ACL can use the wildcard(\*, ?) in the path.
* Don't use '!' in your path because it's ACL Delimiter
* Use 'escapeEarly=false' as default setting but it doesn't matter turning on/off 'Escape token input' option in the Property Manager


## Usage

#### EdgeAuth Class

```Javascript
class EdgeAuth {
    constructor(options) {}
}
```

| Parameter | Description |
|-----------|-------------|
| options.tokenType | Select a preset. (Not Supported Yet) |
| options.tokenName | Parameter name for the new token. [ Default: \_\_token\_\_ ] |
| options.key | Secret required to generate the token. It must be hexadecimal digit string with even-length. |
| options.algorithm  | Algorithm to use to generate the token. ('sha1', 'sha256', or 'md5') [ Default: 'sha256' ] |
| options.salt | Additional data validated by the token but NOT included in the token body. (It will be deprecated) |
| options.startTime | What is the start time? (Use string 'now' for the current time) |
| options.endTime | When does this token expire? endTime overrides windowSeconds |
| options.windowSeconds | How long is this token valid for? |
| options.fieldDelimiter | Character used to delimit token body fields. [ Default: ~ ] |
| options.aclDelimiter | Character used to delimit acl. [ Default: ! ] |
| options.escapeEarly | Causes strings to be url encoded before being used. |
| options.verbose | Print all parameters. |


#### EdgeAuth's Method

```Javascript
generateURLToken(url) {}
generateACLToken(acl) {}

// both return the authorization token string.
```

| Parameter | Description |
|-----------|-------------|
| url | Single URL path (String) |
| acl | Access Control List can use the wildcard(\*, ?). It can be String (single path) or Array (multi paths) |


## Others

If you use the **Segmented Media Protection** behavior in AMD(Adaptive Media Delivery) Product, **tokenName(options.tokenName)** should be '**hdnts**'.

<div style="text-align:center"><img src=https://github.com/AstinCHOI/akamai-asset/blob/master/edgeauth/segmented_media_protection.png?raw=true/></div>


## Command

You can use the command with [cms-edgeauth.js](https://github.com/akamai/EdgeAuth-Token-Node/blob/master/cms-edgeauth.js) in your terminal with [commander](https://www.npmjs.com/package/commander) to generate the token.

```Shell
$ npm install commander --save
$ node cms-edgeauth.js --key YourEncryptionKey --window 5000 --url /hello/world --escape_early
```

Use -h or --help option for the detail.