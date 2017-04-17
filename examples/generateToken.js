/**
 * Created by shan on 4/9/17.
 */

var AuthToken = require('../lib/akamai/authtoken/authtoken');

var atk = new AuthToken({
    key: "7a5c2be9f42a1f32cd889d1cf775f05d0cd162bd2871d00fe705ab28c9bba5a5"
    ,startTime: new Date()
    ,windowSeconds: 2*60*60
    ,accessList: ["/test/*","/sample/*"]
    ,ipAddress: '192.168.0.1 ipv6 입니다 : af:1a:3d:99:04:0f'
});
atk.generateToken();

atk.setOptions({key:'abc', accessList:['/*']});
atk.generateToken();



console.log("=== END ===");


//AuthToken.generateUrl();