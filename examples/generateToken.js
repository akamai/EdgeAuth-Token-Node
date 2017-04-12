/**
 * Created by shan on 4/9/17.
 */

var AuthToken = require('../lib/akamai/authtoken/authtoken');

var atk = new AuthToken({
    key: "7a5c2be9f42a1f32cd889d1cf775f05d0cd162bd2871d00fe705ab28c9bba5a5"
    ,startTime: new Date()
    ,windowSeconds: 2*60*60
    //,accessList: ["/test/*","/sample/*"]
});
atk.generateToken();
console.log("=== END ===");


//AuthToken.generateUrl();