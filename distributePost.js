
var G = require('./GLOBALS.js');

var fs = require('fs');
var mailer = require('nodemailer');

// unreadCount Check
const unreadCountFile = G.unreadCountFile;
var unreadCountStr= fs.readFileSync(unreadCountFile, 'utf8'); // Read Unread Count
var unreadCount = Number(unreadCountStr);
if (unreadCount <= 0) {return}  // End 


var smtpConfig = {
    service: G.smtpService,
    auth: {
        user: process.argv[2], // node実行時の第2パラメータ
        pass: process.argv[3]  // 第3パラメータ
    }
};



//メールの内容
//  件名 lasttitle.txt
//  本文 lastbody.txt (HTML alternative textも)
//  to: MLメンバー全員
var mailOptions = {
    from:  process.argv[2],
    to: 'kunitone.hub@gmail.com',
    subject: '試験メール',
    html: '<pre>こんにちは</pre>' //HTMLタグが使えます
};

//SMTPの接続
var smtp = mailer.createTransport(smtpConfig);


//メールの送信
smtp.sendMail(mailOptions, function(err, res){
    //送信に失敗したとき
    if(err){
        console.log(err);
    //送信に成功したとき
    }else{
        console.log('Message sent successfully.');
    }
    //SMTPの切断
    smtp.close();
});