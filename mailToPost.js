
var G = require('./GLOBALS.js');
var MailParser = require("mailparser").MailParser;
var mailparser = new MailParser();
var fs = require('fs');

const mailFile = G.mailFile;

// unreadCount Check
const unreadCountFile = G.unreadCountFile;
var unreadCountStr = fs.readFileSync(unreadCountFile, 'utf8'); // Read Unread Count
var unreadCount = Number(unreadCountStr);
if (unreadCount <= 0) { return }  // End 

const postFilePrefix = process.argv[4];  // post fileの名前のprefix
const seqnoFile = G.seqnoFile;
var postFileSeqNoStr = fs.readFileSync(seqnoFile, 'utf8'); // Read seqno.data

const contentRoot = process.argv[2];
const postFileFolderPath = contentRoot + G.postFolder;
const attachedFileFolderPath = contentRoot + G.attachedFolder;
const attachedFileBaseURL = process.argv[3];

var postFileSeqNo = 0;  // 投稿ファイルのSeq No.
var postFile = ' ';     // blog投稿ファイル名
var isComment = false;  // メールのsubjectでコメントかどうかを判断した結果

// const templateFile = G.templateFile;
const headerTemplateFile = G.headerTemplateFile;
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

    var regexp = new RegExp(file);
    console.log(regexp);

    var list = fs.readdirSync(postFileFolderPath);

    for (var i = 0; i < list.length; i++) {
        // console.log(list[i]);
        if (regexp.test(list[i])) {
            console.log('***match***');
            postFile = list[i];
            return true;
        }
    }
    return false;
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
        postFile = postFilePrefix + postFileSeqNoStr ;
    }
    postFile = postFileFolderPath + postFile;
    console.log(postFile);

}


var headerTemplateStr = fs.readFileSync(headerTemplateFile, 'utf8'); // Read Blog Header Template File
var bodyTemplateStr = fs.readFileSync(bodyTemplateFile, 'utf8');   // Read Blog Body Template File

var templateLinkLine = ' <br><a href="#url#" target="_blank">・#file#</a>';

fs.createReadStream(mailFile).pipe(mailparser);

mailparser.on("end", (mail_object) => {
    console.log("Subject:", mail_object.subject);
    var subject = mail_object.subject;
    getPostFile(subject); // subjectからコメントの判定とpostファイル名を決定

    console.log("Date:", mail_object.headers.date);
    // console.log("From:", mail_object.headers.from);
    // console.log("headers:", mail_object.headers);
    var mailSender = mail_object.headers.from;
    console.log('From mail :' + mailSender);

    // return-path があればそれを送信者アドレスとする
    if (typeof mail_object.headers['return-path'] !== 'undefined') {
        if (typeof mail_object.headers['return-path'] == 'string') {
            mailSender = mail_object.headers['return-path'];    // <Mail address in Return-Path Header>
            mailSender = mailSender.replace(/</,'');
            mailSender = mailSender.replace(/>/,'');
        } else {
            mailSender = mail_object.headers['return-path'][1]; // Mail address in Return-Path Header
        }
        console.log('Return Path = ' + mailSender);
    }

    console.log("日付:", mail_object.date.toLocaleString());

    headerTemplateStr = headerTemplateStr.replace(/#title#/, mail_object.subject);

    var postDate = new Date(mail_object.headers.date);
    headerTemplateStr = headerTemplateStr.replace(/#date#/, G.formatDate(postDate, 'MM-DD-YYYY')); // for meta data


    bodyTemplateStr = bodyTemplateStr.replace(/#datetime#/, G.formatDate(postDate, 'YYYY/MM/DD hh:mm:ss')); // for display 
    bodyTemplateStr = bodyTemplateStr.replace(/#from#/, mailSender);

    if (typeof mail_object.html === 'undefined') {  // HTMLオブジェクトが未定義ならば
        bodyTemplateStr = bodyTemplateStr.replace(/#body#/, '<pre>' + mail_object.text + '</pre>');
    } else {
        bodyTemplateStr = bodyTemplateStr.replace(/#body#/, mail_object.html);
    }

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
        postFile = postFile + G.formatDate(postDate, '-YYYYMMDD-hhmmss') + '.txt';
        fs.writeFileSync(postFile, headerTemplateStr + bodyTemplateStr);
    }

    fs.writeFileSync(lastBodyFile, bodyTemplateStr);
    fs.writeFileSync(lastTitleFile, lastTitle);

});

