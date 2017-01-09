
# Nodeとシェルの併用のメリット
# 1)  Node自体の終了時にはすべての非同期処理が終了している？？
# 2)  データをファイル経由にして複雑な処理も順次処理していける
# 3)　スケジュール処理やインターバル繰り返し処理が制御しやすい

# 実行環境・公開環境依存の定数はシェルの変数からnode.jsに渡す

$contentRoot = 'C:\\somewhere\\apache2\\htdocs\\pulse\\content\\'
$attachedFileBaseURL = 'http://www.example.net/pulse/content/media/attached/'
$userID = 'your mail account'
$userPW = 'your password'
$postFilePrefix = 'BLOG-'   # Blog post file name prefix


node  getUnreadmail.js $userID $userPW

node  mailToPost.js  $contentRoot $attachedFileBaseURL $postFilePrefix
