/*　todo 170117 Postファイル名のパターンを可変に設定可能とし、YYMMnnnnn.txt などもできるようにする*/
var G = require('./GLOBALS.js');
var MailParser = require("mailparser").MailParser;
var mailparser = new MailParser();
var fs = require('fs');
let mailer = require('nodemailer');

// Get argv
const username =  process.argv[2];
// const pw =  process.argv[3];
const csv =  process.argv[4];  // CSV file name
const adminMail =   process.argv[5];
const contentRoot = process.argv[6];
const attachedFileBaseURL = process.argv[7];
const postFilePrefix = process.argv[8];  // post fileの名前のprefix

var addrs = G.getCSV(csv);

const mailFile = G.mailFile;
const mailSenderNameFile = G.mailSenderNameFile;
// unreadCount Check
const unreadCountFile = G.unreadCountFile;
var unreadCountStr = fs.readFileSync(unreadCountFile, 'utf8'); // Read Unread Count
var unreadCount = Number(unreadCountStr);
if (unreadCount <= 0) {
    return
}  // End

const seqnoFile = G.seqnoFile;
/*　todo 170302  seqnoFileがなければ00001で初期化 とする*/

var postFileSeqNoStr = fs.readFileSync(seqnoFile, 'utf8'); // Read seqno.data


const postFileFolderPath = contentRoot + G.postFolder;
const attachedFileFolderPath = contentRoot + G.attachedFolder;

var postFileSeqNo = 0;  // 投稿ファイルのSeq No.
var postFile = ' ';     // blog投稿ファイル名
var isComment = false;  // メールのsubjectでコメントかどうかを判断した結果

const postHeaderTemplateFile = G.postHeaderTemplateFile;
const mailHeaderTemplateFile = G.mailHeaderTemplateFile;
const bodyTemplateFile = G.bodyTemplateFile;
const lastBodyFile = G.lastBodyFile;
const lastTitleFile = G.lastTitleFile;


/*
 Mail Subject に '[PREFIX-NNNNN]'が含まれるときコメントとみなす

 コメントの場合
 ・bodyTemplateStrをメール本文、日付、投稿者で作成
 ・blogフォルダーのWA22-NNNNNのファイルに対してfs.appendFileSync(file, data[, options])
 ・lasttitle.txt メール件名
 ・lastbody.txt  = bodyTemplateStr

 */
function findPostFile(file) {

    let regexp = new RegExp(file);
    console.log(regexp);

    let list = fs.readdirSync(postFileFolderPath);

    for (let i = 0; i < list.length; i++) {
        // console.log(list[i]);
        if (regexp.test(list[i])) {
            console.log('***match***');
            postFile = list[i];
            return true;
        }
    }
    return false;
}

function unknownUser(mailAddr) {
    let smtpConfig = G.smtpConfig;
    let mailOptions = {
        from:  username,
        to: adminMail,
        bcc: [],
        subject: G.alertMailTitle,
        html: G.alertMailText.replace('##UNKNOWN##',mailAddr)
    };
    //SMTPの接続
    let smtp = mailer.createTransport(smtpConfig);
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


function getPostFile(subject) {
    var s = subject.indexOf('[' + postFilePrefix);
    if ((s >= 0) && (s <= 4)) {  // subject の先頭部分にpostFilePrefixがあればコメント
        // console.log('s=' + s);
        var nn = subject.substr(s + postFilePrefix.length + 1, 5);
        console.log(nn);
        var file = postFilePrefix + nn;
        isComment = findPostFile(file);
    }

    if (isComment) {
    } else {
        postFileSeqNo = Number(postFileSeqNoStr) + 1;
        postFileSeqNoStr = ("00000" + postFileSeqNo.toString(10)).slice(-5); // add leading zero to make 5 digit number
        fs.writeFileSync(seqnoFile, postFileSeqNoStr);
        postFile = postFilePrefix + postFileSeqNoStr;
    }
    postFile = postFileFolderPath + postFile;
    console.log(postFile);

}


var postHeaderTemplateStr = fs.readFileSync(postHeaderTemplateFile, 'utf8'); // Read Blog Header Template File
var mailHeaderTemplateStr = fs.readFileSync(mailHeaderTemplateFile, 'utf8'); // Read Mail Header Template File
var bodyTemplateStr = fs.readFileSync(bodyTemplateFile, 'utf8');   // Read Blog Body Template File

var templateLinkLine = ' <br><a href="#url#" target="_blank">・#file#</a>';

fs.createReadStream(mailFile).pipe(mailparser);

mailparser.on("end", (mail_object) => {  // Mail Parse End  Block

console.log("Subject:", mail_object.subject);
var subject = mail_object.subject;
getPostFile(subject); // subjectからコメントの判定とpostファイル名を決定

console.log("Date:", mail_object.headers.date);
// console.log("From:", mail_object.headers.from);
// console.log("headers:", mail_object.headers);

var mailSender = mail_object.headers.from;

console.log('From mail :' + mailSender);



// return-pathを送信者アドレスとする。なければSPAMとみなす
if (typeof mail_object.headers['return-path'] === 'undefined') {
    // 未登録者エラー
    fs.writeFileSync(mailSenderNameFile, 'unknown', 'utf-8');
    unknownUser(mailSender+' has no return-path');
    return;
} else {
  if (typeof mail_object.headers['return-path'] === 'string') {
    mailSender = mail_object.headers['return-path']; // <Mail address in Return-Path Header>
    mailSender = mailSender.replace(/</, '');
    mailSender = mailSender.replace(/>/, '');
  } else {
    mailSender = mail_object.headers['return-path'][1]; // Mail address in Return-Path Header
  }
  console.log('Return Path = ' + mailSender);
}


var mailSenderName = G.getPosterName(mailSender);
fs.writeFileSync(mailSenderNameFile, mailSenderName, 'utf-8');
if (mailSenderName == 'unknown') {     // 未登録者エラー
    console.log('Unknown Sender: '+mailSender);
    unknownUser(mailSender);
    return;
}

console.log("日付:", mail_object.date.toLocaleString());

postHeaderTemplateStr = postHeaderTemplateStr.replace(/#title#/, mail_object.subject);
mailHeaderTemplateStr = mailHeaderTemplateStr.replace(/#title#/, mail_object.subject);

var postDate = new Date(mail_object.headers.date);
postHeaderTemplateStr = postHeaderTemplateStr.replace(/#date#/, G.formatDate(postDate, 'MM-DD-YYYY')); // for meta data
postHeaderTemplateStr = postHeaderTemplateStr.replace(/#datetime#/, G.formatDate(postDate, 'YYYY-MM-DD hh:mm:ss')); // for meta data

bodyTemplateStr = bodyTemplateStr.replace(/#datetime#/, G.formatDate(postDate, 'YYYY/MM/DD(W) hh:mm:ss')); // for display
bodyTemplateStr = bodyTemplateStr.replace(/#from#/, mailSenderName);

let timestamp= new Date();
let ts_string = G.formatDate(timestamp,'YYYYMMDD-hhmmss');


if (typeof mail_object.html === 'undefined') {  // HTMLオブジェクトが未定義ならば
    bodyTemplateStr = bodyTemplateStr.replace(/#body#/, mail_object.text.replace(/\r?\n/g, "<br />") );
} else {
    let HTMLwork = mail_object.html;
    HTMLwork = HTMLwork.replace(/<o:p>/g,"");  // Remove OUTLOOK specific <o> tag\
    HTMLwork = HTMLwork.replace(/<\/o:p>/g,"");
    bodyTemplateStr = bodyTemplateStr.replace(/#body#/, HTMLwork);
}

fs.writeFileSync(G.mailHTML+ts_string+'.html', mail_object.html); // Put HTML source
fs.writeFileSync(G.mailHTML+ts_string+'.txt', mail_object.text);  // Put TXT source

if (typeof mail_object.attachments === 'undefined') {  // attachmentsが未定義ならば
    bodyTemplateStr = bodyTemplateStr.replace(/##attached file list##/, ' '); // 添付ファイルがなければ見出しなし
} else {
    mail_object.attachments.forEach(function (attachment) {
        bodyTemplateStr = bodyTemplateStr.replace(/##attached file list##/, '**添付ファイルの一覧(クリックするとダウンロードまたは表示)**'); // 添付ファイル見出し
        var fileName = attachment.generatedFileName;
        // console.log(fileName);
        var savedFileName = G.formatDate(postDate, 'YYYYMMDD-hhmmss-') + fileName;
        var attachedFile = attachedFileFolderPath + savedFileName;
        fs.writeFileSync(attachedFile, attachment.content);
        var attachedFileLink = templateLinkLine;
        attachedFileLink = attachedFileLink.replace('#file#', fileName);
        attachedFileLink = attachedFileLink.replace('#url#', attachedFileBaseURL + savedFileName);
        console.log(attachedFileLink);
        bodyTemplateStr = bodyTemplateStr + attachedFileLink;
    });
}

// postFile = postFileFolderPath + postFilePrefix + postFileSeqNoStr + G.formatDate(postDate, '-YYYYMMDD-hhmmss') + '.txt';
// console.log(postFile);

if (isComment) {
    var lastTitle = subject;
    var commentStart = '\n \n ====コメント (' + lastTitle + ')====\n';
    fs.appendFileSync(postFile, commentStart + bodyTemplateStr);
} else {
    var lastTitle = '[' + postFilePrefix + postFileSeqNoStr + ']' + subject;
    postFile = postFile + G.formatDate(postDate, '-YYYYMMDD-hhmmss') + G.postSuffix;
    fs.writeFileSync(postFile, postHeaderTemplateStr + bodyTemplateStr);
}

fs.writeFileSync(lastBodyFile, mailHeaderTemplateStr + bodyTemplateStr);
fs.writeFileSync(lastTitleFile, lastTitle);

})
;

