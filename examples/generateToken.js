/**
 * Created by shan on 4/9/17.
 */

var AuthToken = require('../lib/akamai/authtoken/authtoken');

var atk = new AuthToken({
    tokenName: "token"
    ,key: "7a5c2be9f42a1f32cd889d1cf775f05d0cd162bd2871d00fe705ab28c9bba5a5"
    ,startTime: 1492404013
    ,windowSeconds: 604800
    ,accessList: ["/*"]
});

console.log("GENERATED TOKEN: " + atk.generateToken());

console.log("=== Modifying existing options ===");
atk.setOptions(
    {
        escapeEarly: true
        ,escapeEarlyUpper: true
        ,algorithm: 'md5'
    }
    ,true
);
console.log("GENERATED TOKEN: " + atk.generateToken());

console.log("=== Replacing existing options ===");
atk.setOptions(
    {
        algorithm: 'sha1'
        ,key: "7a5c2be9f42a1f32cd889d1cf775f05d0cd162bd2871d00fe705ab28c9bba5a5"
        ,startTime: new Date()
        ,accessList: ['/example1','/example2']
    }
);
console.log("GENERATED TOKEN: " + atk.generateToken());

//AuthToken.generateUrl();