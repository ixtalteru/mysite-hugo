---
title: "FAX サーバー の 構築"
date: 2026-10-12T14:00:00+09:00
draft: false
translationKey: Setting-Up-Fax-Server
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## やぁみんな
ジュークだよ。
今回は、UbuntuでFAXサーバーを動かす「FAXサーバーインストーラー v1.0.0-rc20」の使い方を紹介するよ。

FAXサーバーの概要はおいらの動画を見てくれ。
[![Video](cover.jpg)](https://youtu.be/5gH5kQdQ6ZA)
<p style="text-align: center;">
【構築】 FAX を 作ってみた 【宇ノ月ジューク / JUKE UNOTSUKI】
</p>

メールで送った原稿をFAXにして、届いたFAXはPDFで受け取る。そんな仕組みを、番号付きのメニューを進めながら設定していくんだ。
SIPやメールの設定ファイルを一つずつ手で作る代わりに、接続情報を入力して、インストーラーに本体の導入と検査を任せる流れだよ。
それじゃぁ、準備から順番に進めていこう。
* * *
## 重要事項
- **製作者は、法令上認められる範囲において、本動画・インストーラの利用によって生じた損害について責任を負わない。**
- **本インストーラはFAXの動作を保証するものではない。**
- **本動画はインストーラの動作を保証するものではない。**
- **製作者はインストーラの動作およびFAXの動作について、如何なる質問・意見を受け付けない。**
- **本インストーラの導入-設定-運用は、すべて利用者自身の責任において行うこと。**
- **実際のFAXで使用する前に、必ず利用者自身の環境で送受信テストを行うこと。**
- **本システムを緊急通報、生命・身体・財産の安全に関わる用途、その他高い信頼性を必要とする用途には使用しないこと。**

上記はこのFAXサーバーを導入するにあたっての約束だ。
よく読んで、同意できる人のみ次へ進んでくれ。
* * *
## 最初に
この記事で使うのは **1.0.0-rc20** だ。完成版ではなく、検証中のRC版だよ。
まずは検証用のUbuntu環境で試してくれ。すでにFAXサーバーが動いている場合は、バックアップと切り替えの段取りも用意しておこう。
ここではUbuntuへのSSH接続と、管理ユーザーの公開鍵認証ができているところから始めるよ。

### 記事のボックスの見分け方
この記事では、ボックスの見出しで「実行するもの」と「画面を説明するもの」を分けているよ。
|ボックスの見出し|読み方|
|---|---|
|**【実行コマンド】**|Ubuntuのターミナルへコピーして実行する。コードの種類は `sh` だ|
|**【画面例・実行しない】**|インストーラーに表示される画面の例だ。ボックス全体は実行せず、起動済みの画面で番号や値を入力する|
|**【操作順・実行しない】**|どのメニューを選ぶかを示した案内だ|
|**【メール記入例・実行しない】** など|メールの書き方、ファイル名、保存場所の説明だ|

画面例は、上段に画面名、下段に画面内容を配置した2行1列の表で載せている。実行コマンドは通常のコードボックスなので、形と見出しの両方で区別できるよ。画面例はそのままシェルに貼り付けないでくれ。
メニューの番号と項目名はRC20の実装に合わせている。状態表示や途中の案内は省略した例で、末尾の入力値は操作例だよ。パスワードなどの `<…>` は記事内の説明用で、実際に入力する文字ではない。
* * *
## どんなことができるの？
送信するときは、登録したメールアドレスからFAX専用のメールアドレスへ依頼を送る。件名に相手のFAX番号を書き、本文や添付した原稿をFAXとして送る仕組みだ。
受信するときは、SIP回線で受けたFAXをPDFに変換して、登録先のメールアドレスへ届けるよ。
流れにすると、こんな感じだ。

**【説明図・実行しない】メールとFAXの流れ**
```text
【送信】
利用者のメール → FAX専用メールボックス → Ubuntuサーバー → SIP回線 → 相手のFAX

【受信】
相手のFAX → SIP回線 → Ubuntuサーバー → PDFをメールでお届け
```

「FAXを送っていい人」と「受信PDFを受け取る人」は別々に登録できる。同じアドレスを両方に登録することもできるよ。
RC20の主な通信設定は次のとおりだ。
|項目|設定|
|---|---|
|通信速度|2400～9600bps|
|使用するFAXモデム方式|V.29 / V.27|
|ECM|有効。ただし相手との交渉で非ECMになる場合がある|
|送受信の時間上限|90分|
|受信応答後の待機|0秒|
|送信開始前の待機|12秒|
|原稿のページ数|本文と添付原稿を合わせて最大20ページ|
|同時通話|送受信を合わせて1通話|

90分は設定上の上限だ。90分間の実通信を最後まで検証したという意味ではないよ。
* * *
## 用意するもの
### Ubuntuサーバー
対応する組み合わせは、Ubuntu 22.04・24.04・26.04と、amd64だ。
OSとCPUの種類は、次のコマンドで確認できる。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
cat /etc/os-release
dpkg --print-architecture
```

インストーラーがパッケージやソースを取得するので、インターネットへの接続も必要だ。
### SIP回線の情報
MY050、または対応する他社SIPサービスの情報を用意する。
- SIPサーバー名とポート番号
- 認証ユーザー名
- ユーザーID
- FAXとして使う電話番号
- SIPパスワード

他社SIPの設定は、ユーザー名とパスワードで登録するUDP/TCP、G.711音声FAXが対象だ。TLS、T.38専用回線、IP認証、独立したアウトバウンドプロキシ、IPv6のSIPサーバー指定は未対応だよ。
設定を生成できることと、その事業者の回線でFAXが通ることは別なので、最後に送受信を確認しよう。
### メールの情報
FAX専用に使うメールアドレスと、IMAP・SMTPの接続情報を用意する。
|項目|用意する内容|
|---|---|
|FAX専用アドレス|送信依頼を受け取るメールアドレス|
|IMAP|サーバー名、ポート、暗号化方式、ログイン名、パスワード、フォルダ|
|SMTP|サーバー名、ポート、暗号化方式、ログイン名、パスワード|
|送信許可アドレス|メールでFAX送信を依頼する人のアドレス|
|受信PDFの転送先|届いたFAXのPDFを受け取るアドレス|

メール側で利用できる認証情報を準備しておこう。Webメールへログインできるだけで、IMAPやSMTPも使えるとは限らないんだ。
さらに、このサーバーはメールの差出人を文字列だけで判断せず、認証結果や署名も検証する。接続情報が合っていても、署名の検証条件を満たさなければ本番開始まで進まないよ。
* * *
## 配布ファイルを展開しよう
### ダウンロード

**FAX Server Installer 1.0.0-rc20**

- [インストーラーをダウンロード（fax-server-installer-1.0.0-rc20.tar.gz）](/distribution/fax-server-installer-1.0.0-rc20/fax-server-installer-1.0.0-rc20.tar.gz)
- [SHA256チェックサムをダウンロード](/distribution/fax-server-installer-1.0.0-rc20/fax-server-installer-1.0.0-rc20.tar.gz.sha256)


用意するファイルは、この二つだ。

**【ファイル名・実行しない】転送する配布ファイル**

```text
fax-server-installer-1.0.0-rc20.tar.gz
fax-server-installer-1.0.0-rc20.tar.gz.sha256
```

二つともUbuntuサーバーの同じディレクトリへ転送して、そのディレクトリで作業しよう。
まずはファイルが壊れていないか確認する。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
sha256sum -c fax-server-installer-1.0.0-rc20.tar.gz.sha256
```
`OK` が出たら、RC20専用のフォルダへ展開する。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
mkdir -p ~/fax-installer-rc20
tar -xzf fax-server-installer-1.0.0-rc20.tar.gz -C ~/fax-installer-rc20
cd ~/fax-installer-rc20/fax-server-installer
```
旧版がある場合も、そちらのフォルダへ上書きせず、別の場所へ展開してくれ。
続いて、配布物の中身を検査しよう。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
python3 -B faxsetup/cli.py check-bundle
```

検査が通ったら、インストーラーを起動する。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
sudo --preserve-env=SSH_CONNECTION bash install.sh
```
`SSH_CONNECTION` を引き継ぐのは、あとでSSH接続を使ったファイアウォールの確認を行うためだ。SSHで作業しているときは、この形で起動しよう。
* * *
## メニューは1から順番に進めよう
基本の流れは次の六つだ。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── セットアップ手順 ──
1. 管理ユーザー・管理端末を設定
2. SIP情報を設定
3. メール・利用者を設定
4. ファイアウォール設定を保存（まだ適用しない）
5. 本体インストール・更新
6. 接続検証・FW適用・本番開始
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>


|番号|メニュー|やること|
|---|---|---|
|1|管理ユーザー・管理端末を設定|SSHで管理するユーザーと接続元を登録|
|2|SIP情報を設定|電話回線の接続情報を登録|
|3|メール・利用者を設定|メール接続先と利用者を登録|
|4|ファイアウォール設定を保存|SSHポートと許可する接続元を保存|
|5|本体インストール・更新|設定を検査して本体を導入|
|6|接続検証・FW適用・本番開始|外部接続を確認して運用を開始|

どのメニューも、**0が「戻る / 終了」** だ。1の設定が終わったら0で戻り、2へ進む、という具合だよ。
途中で終了しても保存した設定は残るので、あとから再開できる。

### 1. 管理ユーザー・管理端末を設定
すでにSSHで使っている管理ユーザーと、管理端末の接続元範囲を入力する。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】管理ユーザーと管理端末の入力例</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">既存の管理ユーザー: ubuntu
保存しました。
管理端末のIPまたはネットワーク（例: 192.168.0.0/24） [&lt;現在の候補&gt;]: 192.168.0.0/24
保存しました。</code></pre></td>
</tr>
</tbody>
</table>

`ubuntu` と `192.168.0.0/24` は例だよ。ユーザー名は実際に存在する管理ユーザーへ、接続元は自分の環境へ置き換えよう。角括弧の候補は接続元や保存値によって変わる。
ここでの管理ユーザーは、FAXを送る人のメールアドレスではない。Ubuntuへログインして設定するためのユーザーだよ。
接続元の範囲は、自分のネットワークに合わせて指定しよう。いま使っている管理端末が許可範囲から外れないように確認してくれ。

### 2. SIP情報を設定
用意したSIPサーバー、認証ユーザー名、ユーザーID、電話番号、パスワードを登録する。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 2. SIP情報入力 ──
1. MY050のサーバー設定を使用
2. 他社SIPサーバー / IP・ポート・通信方式
3. SIP認証ユーザー名
4. SIPユーザーID
5. FAX電話番号 / 内線番号
6. SIPパスワード
7. 詳細: SIPドメイン・着信識別子
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

MY050なら1でサーバー設定を保存し、3〜6で自分の認証情報を入力する。他社SIPなら2から接続先を設定しよう。
認証ユーザー名とユーザーIDは、サービスによって同じ場合も別の場合もある。思い込みで埋めず、契約先の情報をそのまま確認しよう。

### 3. メール・利用者を設定
FAX専用メールと、IMAP・SMTPの情報を登録する。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 3. FAXサーバー用メール設定 ──
1. FAX専用メールアドレス
2. Gmailを使う（サーバー名を自動設定）
3. 受信IMAPの設定・パスワード
4. 送信SMTPの設定・パスワード
5. 送信許可者・受信FAX転送先
6. 迷惑メール・なりすまし対策
7. 処理済みメールをごみ箱へ移動
0. 戻る / 終了
番号 [0]: 2</code></pre></td>
</tr>
</tbody>
</table>

Gmailなら2でサーバー名を設定し、1でFAX専用アドレス、3と4でログイン名とパスワードを入力する。2を選ぶだけでは認証情報まで埋まらないよ。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】Gmail設定後のIMAP入力例</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">IMAPサーバー名 [imap.gmail.com]:
保存しました。
IMAPポート [993]:
保存しました。
IMAPログイン名: fax-account@example.com
保存しました。
IMAPパスワード: &lt;非表示で入力&gt;
保存しました。</code></pre></td>
</tr>
</tbody>
</table>

空欄の行はEnterで現在値を保持する例だ。`fax-account@example.com` は説明用アドレスなので、自分のログイン名へ置き換えよう。パスワードは実際の画面では入力文字が表示されない。

続いて、FAXを送信できる人と、受信PDFを届ける人を設定しよう。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 利用者メールアドレス ──
1. メールアドレスを追加
2. 既存利用者の権限・アドレスを変更
3. 利用者を削除
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】利用者追加後の権限設定例</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">追加するメールアドレス: user@example.com
この利用者を有効にする (y/n) [y]: y
メールによるFAX送信依頼を許可する (y/n) [n]: y
受信FAXのPDFをこのアドレスへ転送する (y/n) [n]: y</code></pre></td>
</tr>
</tbody>
</table>

途中の説明を省略した例だよ。ここでは送受信の両方を有効にしている。送信だけ、受信だけにしたい場合は、不要な方を `n` にしよう。
たとえば、同じ人が送信も受信も担当するなら、両方の用途で登録する。送信だけを許可したい人なら、送信の権限だけにするんだ。
画面に出てくる「送信を依頼できるアドレス数」と「受信PDFを届けるアドレス数」は、登録したアドレスの件数だ。FAXを何枚送ったか、何件受け取ったかを表しているわけではないよ。

### 入力済みの情報をそのまま使いたいとき
SIP IDやメールアドレスなどは、保存済みでも値を既定値として画面に表示しない。「登録済み」と出ている項目は、Enterだけで保存値を保持できるよ。
変更したいときだけ、新しい値を入力しよう。パスワードは非表示入力だ。
ただし、自分で入力したメールアドレスや、利用者の選択一覧は画面に表示される。動画収録や画面共有をする場合は、その部分に気をつけてくれ。

### 4. ファイアウォール設定を保存
SSHポートと、接続を許可するIPアドレスの範囲を保存する。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 4. ファイアウォール設定を保存 ──
1. SSHポート・許可IPを入力して保存
2. 保存した内容を表示
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

ここでは候補を保存するだけで、まだファイアウォールを切り替えるわけではない。実際の適用と接続確認は、手順6で行うよ。
* * *
## 本体をインストールしよう
メインメニューの **5. 本体インストール・更新** を開く。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 5. 本体インストール・更新 ──
1. 設定内容の不足を確認
2. 手順1～4で保存した設定を使ってインストール
3. 修復・更新
4. アンインストール（データ・設定・SSH/FWは保持）
5. 設定バックアップ
6. 設定バックアップを復元
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

最初に選ぶのは、**1. 設定内容の不足を確認** だ。
必須項目や形式を調べ、入力に不足がなければ、OS・空き容量・メモリー・管理公開鍵・APT依存関係などの導入前検査へ進む。
問題があったら、表示された項目の設定へ戻って直そう。
この画面の `OK` は、インストール完了の意味ではない。これから行うソース取得やビルド、内部通信試験、メール接続には別の確認が必要なんだ。
入力を確認したら、**2. 手順1～4で保存した設定を使ってインストール** を選ぶ。
同じ手順5の画面へ戻り、今度は `番号 [0]:` に `2` を入力するよ。

確認画面を読んで進めると、パッケージ導入、FAX用モジュールのビルド、内部検証などが始まる。処理中は工程が表示されるので、どこまで進んだか見ながら待とう。
完了後の状態は **STAGED** だ。
これは、本体の導入が済んで本番開始を待っている状態だよ。ここで作業を終えず、続けて手順6へ進もう。
* * *
## 接続を検証して、本番を開始しよう
メインメニューの **6. 接続検証・FW適用・本番開始** を開き、**1. 順番に進める** を選ぶ。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】表示された画面で番号を入力する</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 6. 接続検証・FW適用・本番開始 ──
1. 順番に進める / 中断した手順を再開
2. 新しいSSH接続からFW試行を確定して続ける
3. 詳細な動作検証
4. 導入後のFW管理
5. 送受信メールアドレスの追加・削除・設定反映
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

メール接続の検証、設定の反映、ファイアウォールの試行、本番開始へと進んでいく。
この途中で検証結果を本体へ反映する必要があれば、その場で処理する。手順5へ戻って、もう一度インストールし直す必要はないよ。

### メールの署名確認で止まったら
受信箱のメールから署名や認証結果を自動確認できないと、理由を表示して停止する。
その場合は画面の案内を確認し、必要な検証用メールや設定を用意してから再開しよう。接続できたからといって、未確認の項目を手で「検証済み」に変えないでくれ。

### ファイアウォールは別のSSH接続で確定する
ここは大事なところだ。
ファイアウォールの試行が始まったら、**いまのSSH接続を残したまま、別のターミナルから新しいSSH接続を開く**。
新しい接続で、同じRC20フォルダへ移動してインストーラーを起動しよう。

**【実行コマンド】ターミナルへコピーして実行する**

```sh
cd ~/fax-installer-rc20/fax-server-installer
sudo --preserve-env=SSH_CONNECTION bash install.sh
```

そして、次の項目を選ぶ。

**【操作順・実行しない】メニューで選ぶ順番**

```text
6. 接続検証・FW適用・本番開始
  → 2. 新しいSSH接続からFW試行を確定して続ける
```

最初の画面に表示された試行IDを入力すると、その場で本番開始まで続けられるよ。
新しい接続では、同じ手順6の画面の `番号 [0]:` に `2` を入力する。試行IDは、そのとき実際に表示された値を使おう。
試行は5分以内に確定する必要がある。確定できなければ、元のファイアウォールとSSH設定へ戻す仕組みだ。
同じ接続を使い続けているだけでは、新しい設定でSSH接続できるか確認できない。別の接続を開くのには、ちゃんと意味があるんだ。

### 旧サーバーから切り替える場合
同じSIPアカウントやメールを使っている旧FAXサーバーは、新しいサーバーの本番開始前に停止しておこう。
二つのサーバーが同じ回線やメールを同時に扱わないようにするためだ。
初回の本番開始では、その時点までの受信箱のメールをFAX送信依頼の対象外にする。昔のメールをまとめてFAX送信しないための処理だよ。
また、本番開始前は外線FAXの受信を始めない。最後まで画面に従って進み、`ACTIVE` になったことを確認しよう。
* * *
## 実際にFAXを送ってみよう
送信許可に登録したメールアドレスから、FAX専用アドレスへメールを送る。
書き方はこんな形だよ。

**【メール記入例・実行しない】メール作成画面で入力する内容**

```text
差出人：送信許可に登録した自分のメールアドレス
宛先：設定したFAX専用メールアドレス
件名：相手のFAX番号を半角数字だけで入力
添付：送信したいPDF
```

件名は「見積書」などのタイトルではなく、**相手のFAX番号そのもの** だ。ハイフンや空白、「FAX:」といった文字は付けない。
国内番号の許可・拒否ルールもあるので、数字なら何でも発信できるわけではないよ。
メール本文に内容がある場合は、その本文もFAX原稿になる。PDFだけを送りたい場合は、自動署名などの不要な本文が入っていないかも確認しよう。
本文と添付を合わせて最大20ページだ。最初は自分で受信結果を確認できる宛先へ、1ページの原稿で試すと確認しやすいよ。
送信後は結果通知を確認し、相手側でもページ数と内容を確かめよう。結果が分からないまま同じ依頼を何度も送り直すと、二重送信になる可能性がある。自動再発信はしない設計なので、まず状況を確認してくれ。
* * *
## FAXを受信してみよう
設定したFAX番号へ、別のFAXから原稿を送ってみよう。
受信PDFの転送先に登録したメールアドレスへ、PDFが届くか確認する。
確認するのは、メールが来たかどうかだけではないよ。

- PDFが開けるか
- ページ数が合っているか
- 文字や図が欠けていないか
- 指定した転送先へ届いているか

SMTPサーバーがメールを受け付けたことと、受信者のメールボックスに届いたことは別だ。迷惑メールフォルダも含めて、最後の到着まで見ておこう。
* * *
## 利用者を追加・削除したいとき
本番開始後にアドレスを変更したい場合は、**6 → 5** を開く。

**【操作順・実行しない】メニューで選ぶ順番**

```text
6. 接続検証・FW適用・本番開始
  → 5. 送受信メールアドレスの追加・削除・設定反映
```

この画面には、次の項目があるよ。

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">【画面例・実行しない】送受信メールアドレスの管理</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 6-5. 送受信メールアドレスの管理 ──
1. 送信許可メールアドレスを追加
2. 送信許可メールアドレスを削除
3. 受信PDFの転送先メールアドレスを追加
4. 受信PDFの転送先メールアドレスを削除
5. 保存した設定を反映
0. 戻る / 終了
番号 [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

送信と受信の両方に追加する場合は、1と3でそれぞれ登録する。
追加や削除をしただけでは、まだ本番設定には反映されない。一覧の「未反映の追加」「未反映の削除」を確認してから、**5. 保存した設定を反映** を選ぼう。
反映中はFAX処理を一時停止して検査する。FAXを使っていない時間に行い、画面に従って本番再開まで進めてくれ。
ほかにも保存済みで未反映の変更があれば、それも一緒に適用される。利用者だけを変えたつもりでも、全体の変更内容は確認しておこう。
* * *
## 旧版からRC20へ更新したいとき
新規導入とは少し手順が違うよ。
まず処理中のFAXがないことを確認し、必要なバックアップを取得する。次に、RC20を旧版とは別のフォルダへ展開して起動する。
保存済みの設定は引き継ぐけれど、旧版で保存されていなかった秘密値は再入力が必要だ。
メニューは次の順で進めよう。

**【操作順・実行しない】メニューで選ぶ順番**

```text
5. 本体インストール・更新
  → 3. 修復・更新

導入完了後
  → 6. 接続検証・FW適用・本番開始
```

更新後も、本体の導入だけで終わらせず、接続検証と本番開始まで進めるんだ。
設定バックアップも手順5にある。ただし、これはFAX画像や業務DB、重複防止鍵まで含むサーバー丸ごとのバックアップではない。履歴も含めて戻したい場合は、別途データを保全しておこう。
* * *
## うまく動かないとき
インストールに失敗すると、状態の `FAILED` に加えて、失敗した工程・理由・詳細ログの場所が表示される。
まずは、その画面を読もう。何度も最初から入力し直すより、止まった場所を確認する方が原因を追いやすいよ。
詳細ログは、次のディレクトリへ保存される。

**【保存場所・実行しない】ログが置かれるディレクトリ**

```text
/var/lib/faxmail-installer/errors/
```

画面に出たログファイル名を確認し、そのファイルを管理者権限で読む。ログを人に見せる場合は、内容を確認してから共有してくれ。
よく迷いやすいところもまとめておくよ。

|状態|まず確認すること|
|---|---|
|入力検査はOKなのに導入できない|ソース取得・APT依存関係・ビルド・内部試験のどの工程で止まったか|
|STAGEDのまま|手順6の接続検証と本番開始が完了しているか|
|メール認証で停止する|接続情報だけでなく、受信メールの署名・認証結果も検証できているか|
|FW試行を確定できない|別の新しいSSH接続から操作しているか、試行IDと制限時間が合っているか|
|追加した人がFAXを送れない|アドレスを保存したあとに「設定を反映」まで実行したか|
|受信PDFが届かない|転送先登録、設定反映、メール配送結果、迷惑メールフォルダ|

過去の `FAILED` は、入力検査を通しただけでは成功に変わらない。実際の導入が完了すると `STAGED` になるよ。
* * *
## おわりに
このインストーラーは、接続情報を保存して、本体を導入し、検証してから本番へ進む作りになっている。
最初は **1 → 2 → 3 → 4 → 5 → 6**。本体の導入が終わっても、`STAGED` ならまだ途中だよ。
別のSSH接続でファイアウォールを確定して、本番開始まで進めたら、最後は実際のFAXとメールの到着を確認しよう。
自分のメールからFAXを送り、届いたFAXをPDFで読む。そんな環境を作りたい人は、まず検証用のUbuntuから試してみてくれ。
