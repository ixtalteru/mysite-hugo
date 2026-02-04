---
title: "SSHログインの鍵認証設定について"
date: 2026-02-04
draft: false
translationKey: Setting-Up-Key-Based-Authentication-for-SSH-Login
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
# SSHログインの鍵認証設定について
やぁみんな。
ジュークだよ。
今回は、UbuntuサーバーのSSH接続を鍵認証にしたよ。
設定したのはUbuntuサーバーのバージョン22.04.3だ。
それじゃぁ行ってみよー。
* * *
## SSH鍵の生成
今回はTera Termを使って作業していくよ。
{{% drawing src="001_ja.png" %}}
まずは、Tera Termを開いたら一度接続をキャンセルしてくれ。
{{% drawing src="002_ja.png" %}}
メニューバーの設定からSSH鍵生成をクリックして...
{{% drawing src="003_ja.png" %}}
鍵の種類は"ED25519"を選択して生成をクリックする。
{{% drawing src="004_ja.png" %}}
そうすると、SSH公開鍵と秘密鍵が保存できるので、保存してくれ。
鍵認証にして、鍵が無くなるとサーバーへのログインができなくなるから無くさないよう注意が必要だ。
公開鍵と秘密鍵を保存したら一度、Tera Termを閉じる。
* * *
## SSH公開鍵の設置
{{% drawing src="005_ja.png" %}}
再度Tera Termを開いたら、"OK"をクリックしてログインしてくれ。
{{% drawing src="006_ja.png" %}}
ログインの時に注意してほしいのが、"このホストをknown hostsリストに保存する(A)"のチェックを外して"続行"をクリックしてほしい。
その後は、普通にパスワード認証でログインする。
{{% drawing src="007_ja.png" %}}
サーバーへログイン出来たら、先ほど保存した公開鍵をTera Termへドラックアンドドロップする。
{{% drawing src="008_ja.png" %}}
そうすると上のようなダイアログが表示されるが、何もせずに"OK"をクリックだ。

次にサーバーへ放り込んだ公開鍵を.sshフォルダに移動するのだけど、元々.sshフォルダに入っているauthorized_keysのバックアップをとっておこう。
```
mv .ssh/authorized_keys .ssh/default_authorized_keys
```
id_ed25519.pubをリネームして.sshフォルダに移動させて...
```
sudo mv id_ed25519.pub .ssh/authorized_keys
```
ファイルとディレクトリの権限を変更しよう
```
sudo chmod 700 .ssh
sudo chmod 600 .ssh/authorized_keys
```
* * *
## 設定ファイルの変更
設定を変更する前に、最初からある設定ファイルのバックアップをとっておこう。
```
sudo cp /etc/ssh/sshd_config /etc/ssh/backup_sshd_config
```
設定ファイルを編集するぞ。
今回はエディタにviを使用しているけど、みんなの使いやすいエディタで編集してくれ。
```
sudo vi /etc/ssh/sshd_config
```
編集するのは以下の三点。
ポート番号、ルートログインの禁止、パスワード認証の禁止だ。
```
Port 1975
PermitRootLogin no
PasswordAuthentication no
```
設定ファイルを保存したらsshを再起動してくれ。
* Ubuntu 22の場合
```
sudo systemctl restart sshd
```
* Ubuntu 24の場合
```
sudo systemctl restart ssh
```

* * *
## 動作確認
{{% drawing src="009_ja.png" %}}
Tera Termを開いて、いつも通りログインしてくれ。
{{% drawing src="010_ja.png" %}}
この時も"このホストをknown hostsリストに保存する(A)"のチェックは外して...
{{% drawing src="011_ja.png" %}}
今度は、パスワードではなく保存した秘密鍵を選択してログインしてみてほしい。
{{% drawing src="012_ja.png" %}}
問題なくログイン出来れば、鍵認証設定の完了だ！
