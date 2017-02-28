exports.mailFile = 'mail.txt';
exports.mailSenderNameFile = 'mailsender.txt';
exports.unreadCountFile = 'unreadCount.data';
exports.seqnoFile = 'seqno.data';

exports.postFolder = 'content\\post\\' ;
exports.attachedFolder =  'static\\attached\\';

exports.headerTemplateFile = 'headertemplate.html';
exports.bodyTemplateFile = 'bodytemplate.html';
exports.lastBodyFile = 'lastbody.txt';
exports.lastTitleFile = 'lasttitle.txt';
exports.postSuffix = '.md';

exports.imapHost = 'imap.gmail.com';

exports.smtpService = 'gmail';

/* todo 170116 曜日表示を追加 formatにWを追加　*/
exports.formatDate = function (date, format) {
    if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    if (format.match(/S/g)) {
        var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
        var length = format.match(/S/g).length;
        for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
    }
    return format;
}


// CSVのアドレスブックを読み込む処理

var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var records = {};  // Parsed CSV array

exports.getCSV = function (csvFileName) {
    var csvData = fs.readFileSync(csvFileName, 'utf8');
    records = parse(csvData, { columns: true });
    // console.log(records);
    return records;
}

exports.getPosterName = function (posterMail) {
    var posterName = 'unknown';
    records.some(function (addr) {
        // console.log(posterMail);
        if (addr.mail == posterMail) {
            // console.log(addr.mail + addr.name + ' OK');
            posterName =  addr.name;
            return true;
        } else {
            // console.log(addr.mail + ' NG');
        }
    });
    return posterName;
}