var fs = require('fs');
var G = require('./GLOBALS.js');

const blogPath = 'C:\\Bitnami\\wampstack-5.6.28-1\\apache2\\htdocs\\wa22\\content\\blog\\';

var postFilePrefix = 'WA22-00034';  // post fileの名前のprefix
postFilePrefix = 'WA22-';
var postFileSeqNo = 0;
const seqnoFile = G.seqnoFile;

var isComment = false;
var postFile = ' ';
var subject = '題名はあいうえおです';
// var subject = 'Re:[WA22-00034]あいうえおです';
function getPostFile(subject) {
    var s = subject.indexOf('[' + postFilePrefix);
    if ((s >= 0) && (s <= 4)) {  // subject の先頭部分にpostFilePrefixがあればコメント
        isComment = true;
        console.log('s=' + s);
        var nn = subject.substr(s + postFilePrefix.length + 1, 5);
        console.log(nn);
        postFile = postFilePrefix + nn;
    } else {
        isComment = false;

        var postFileSeqNoStr = fs.readFileSync(seqnoFile, 'utf8'); // Read seqno.data

        postFileSeqNo = Number(postFileSeqNoStr) + 1;
        postFileSeqNoStr = ("00000" + postFileSeqNo.toString(10)).slice(-5); // add leading zero to make 5 digit number
        fs.writeFileSync(seqnoFile, postFileSeqNoStr);
        postFile = postFilePrefix + postFileSeqNoStr;
    }
    postFile = blogPath + postFile;
    
}


getPostFile(subject);
console.log(isComment);
console.log('postFile= '+postFile);

return;


var regexp = new RegExp(postFilePrefix);
console.log(regexp);



var list = fs.readdirSync(blogPath);

var matchedBlog = '';

for (var i = 0; i < list.length; i++) {
    console.log(list[i]);
    if (regexp.test(list[i])) {
        console.log('***match***');
        var matchedBlog = list[i];
        break;
    }
}

if (matchedBlog != '') {
    var post = fs.readFileSync(blogPath + matchedBlog, 'utf8');
    console.log(post);
}