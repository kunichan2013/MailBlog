
var G = require('./GLOBALS.js');

var fs = require('fs');
var mailer = require('nodemailer');

// unreadCount Check
var unreadCountStr= fs.readFileSync(G.unreadCountFile, 'utf8'); // Read Unread Count
var unreadCount = Number(unreadCountStr);
if (unreadCount <= 0) {return}  // End 

// Mail Sender Name Check
var mailSenderName = fs.readFileSync(G.mailSenderNameFile, 'utf8'); // Read blog post mail sender name
if (mailSenderName == 'unknown') {
    return;  // Nothing to do
}

// Get Mail Title
var title = fs.readFileSync(G.lastTitleFile, 'utf8'); // Read lastTitleFile

// Get Mail Body
var body = fs.readFileSync(G.lastBodyFile, 'utf8'); // Read lastBodyFile


let smtpConfig = G.smtpConfig;


var csv =  process.argv[4];  // CSV file name

var addrs = G.getCSV(csv);
var bccs  = G.numberOfBCC;
var numberOfAddrs = addrs.length;

//メールの内容
//  件名 lasttitle.txt
//  本文 lastbody.txt (HTML alternative textも)
//  to: MLメンバー全員
var mailOptions = {
    from:  process.argv[2],
    to: process.argv[5],  // send to archive address
    bcc: [],
    subject: title,
    html: body
};

//SMTPの接続
var smtp = mailer.createTransport(smtpConfig);

var j = 0;
var bccArray = [];

for (var i = 0; i < numberOfAddrs; i++) {
  // console.log(addrs[i].mail);
  bccArray[j] = addrs[i].mail;
  j++;
  if (j >= bccs || i >= (numberOfAddrs - 1)) {
    console.log(bccArray);
    mailOptions.bcc = bccArray;
    bccArray = [];
    j = 0;
    smtp.sendMail(mailOptions, function(err, res) {
      //送信に失敗したとき
      if (err) {
        console.log(err);
        //送信に成功したとき
      } else {
        // console.log("Message sent successfully. "+mailOptions.to);
      }
      //SMTPの切断
      smtp.close();
    });
  }
}




/*

addrs.forEach(function(addr) {
  //メールの送信
  mailOptions.to=addr.mail;
  
  smtp.sendMail(mailOptions, function(err, res) {
    //送信に失敗したとき
    if (err) {
      console.log(err);
      //送信に成功したとき
    } else {
      // console.log("Message sent successfully. "+mailOptions.to);
    }
    //SMTPの切断
    smtp.close();
  });
});
*/