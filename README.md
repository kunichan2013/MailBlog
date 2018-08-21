# MailBlog
## Post Contents to Static CMS  by Mail
## Used to be for Pulse CMS, now for Hugo

# 実行方法
* maintask-sample.ps1参照

# 機能
* INBOXの未読メールを読み込む
   * 送信者がアドレス帳に登録されていれば掲示板の投稿を作成
      * 添付ファイルはmedia/attachedに保存され、ブログ本文にファイルへのリンクを表示
* 投稿メールの配信
   * アドレス帳にあるアドレスに投稿を配信
<pre>
配信には自前のSMTPサーバーでなく
https://github.com/nodemailer/nodemailer-wellknown#supported-services
にあるWell-known Services のいずれかを使うこととする
</pre>

<注意>
* iconv のインストールが必要だがWindowsの場合は事前に
    * Python 2.7
    * Visual C++
    * Windows SDK 8.1

が必要。

後者２つについては
* VS Community Edition 2015でこれらのオプションを有効化してインストール

または

* [Visual C++ Build Tools](http://go.microsoft.com/fwlink/?LinkId=691126)からダウンロードしてインストール

しておくこと。

またnode 7.2.1 以降 npm 4.0.5以降を使わないとコンパイルエラーが発生する可能性あり
