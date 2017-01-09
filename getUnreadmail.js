
var G = require('./GLOBALS.js');

const mailFile = G.mailFile;
const unreadCountFile = G.unreadCountFile;

var inbox = require('inbox');
var async = require('async');
var MailParser = require("mailparser").MailParser;
var mailparser = new MailParser();
var fs = require('fs');

var client = inbox.createConnection(false, 'imap.gmail.com', { // gmail接続
    secureConnection: true,
    auth: {
        user: process.argv[2], // node実行時の第2パラメータ
        pass: process.argv[3]  // 第3パラメータ
    }
});


function writeMailSource(i, stream) { // もし複数の未読メールを順次出力するのならば i を用いてファイル名を変えること

    var writable = fs.createWriteStream(mailFile);
    stream.pipe(writable);

}


function closeInbox() {
    //  return;
    client.close();
    client.on('close', function () {
        console.log('SERVER DISCONNECTED!');
    });
}

function exportUnread(callback, count) {  // count 数のメールを処理
    var query = { unseen: true };
    var i = 0;
    client.search(query, true,
        function (err, UIDs) { //未読メールをサーチ     
            var unreadCount = Object.keys(UIDs).length;
            console.log('Number of unread mails = ' + unreadCount);
            unreadCountStr = ("00000" + unreadCount.toString(10)).slice(-5); // add leading zero to make 5 digit number
            fs.writeFileSync(unreadCountFile, unreadCountStr);

            async.mapSeries(
                UIDs,                      // コレクション
                function (UID, callback) { // コレクションの要素に適用する関数
                    i++;
                    if (i > count) callback(null, res); // ここでリターン
                    res = client.fetchData(UID,
                        function (error, message) {
                            console.log('**UID is <' + UID + '> ');
                            // client.createMessageStream(UID).pipe(process.stdout, { end: false });   // Mail Source output
                            var readStream = client.createMessageStream(UID);   // Mail Source output
                            writeMailSource(i, readStream);
                            client.addFlags(UID, ['\\Seen'], function (err, flags) {                // 既読をセット
                                console.log('Current flags for a message: ', flags);
                                callback(null, res); // ここでリターン
                            });
                        }
                    );
                },
                function (err, result) { // コレクションの最後の処理が終わった時コールされる関数
                    console.log('All mails processed');
                    callback();
                }
            );
        });
}




client.connect();

client.on('connect', function () {
    console.log('Successfully connected to server');
    
    // https://github.com/yortus/asyncawait で書き換える！！

    async.series([
        (step1) => { // Open INBOX 
            client.openMailbox('INBOX', false, function (error, info) {
                if (error) throw error;
                console.log('Message count in INBOX: ' + info.count);
                step1();   // Go to next step
            });

        },
        (step2) => { // 未読メール抽出
            console.log('Get unread mail');
            exportUnread(step2, 1); // 1件だけ処理
        },
        (step3) => { //　Disconnect Server 
            console.log('Close INBOX');
            closeInbox();
            step3();  // Go to next step
        }
    ], function (error, results) {
        if (error) {
            throw error;
        }
        console.log('All steps done');
    });


});

