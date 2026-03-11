---
title: "Cloudflare Tunnel の構築"
date: 2026-03-11
draft: false
translationKey: Setting-Up-Cloudflared
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## やぁみんな。
ジュークだよ。
今回は、Cloudflare Tunnelを使ってgonicサーバーを公開してみたよ。
設定したのはRaspberryPiのUbuntuサーバーのバージョン22.04.3だ。
構築の概要は、おいらの動画を見てくれ。

[![Video](cover.jpg)](https://youtu.be/Y_bi8KQxpRU)
【構築】 Cloudflare Tunnel で サーバー を 公開 しよう! 【宇ノ月ジューク / JUKE UNOTSUKI】

それじゃぁ行ってみよー。
* * *
## 前提条件
* Cloudflare アカウントを取得していること
* 独自ドメイン（1つ以上）を取得していること
* * *
## cloudflared のインストール（公式APT）
Cloudflare 公式リポジトリからcloudflaredをインストールするよ。
#### CloudflareのAPTリポジトリを安全に使うための「署名鍵」をUbuntuに登録
```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
 | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
```
#### cloudflared 用の公式パッケージ配布サーバーを Ubuntu に登録
```bash
 echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
 https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
 | sudo tee /etc/apt/sources.list.d/cloudflared.list
```
#### apt update
```bash
sudo apt update
```
#### cloudflaredのインストール
```bash
sudo apt install -y cloudflared
```
#### 正常にインストールされたか確認
```bash
cloudflared version
```
* * *
## Cloudflare Tunnelへログイン
cloudflaredがインストール出来たら、Cloudflareへログインしよう。
```bash
cloudflared tunnel login
```

* 表示されたURLをコピー
* ブラウザを立ち上げる
* Cloudflare にログイン
* ブラウザでコピーしておいたURLをペースト
* 使用するドメインを選択

成功すると以下のディレクトリとファイルが作成されるよ。

```text
~/.cloudflared/cert.pem
```

※ `cert.pem` は **Tunnel 作成時のみ使用** 

---

## Tunnel の作成
Cloudflareへログインが成功したら、トンネルを作成しよう。
```bash
cloudflared tunnel create my-tunnel
```
`my-tunnel`の部分はみんなの好きな名前に置き換えてね。

成功すると、`.cloudflared`に.jsonファイルが作成される。
```text
Tunnel credentials written to ~/.cloudflared/xxxxxxxx-xxxx.json
```

* `xxxxxxxx-xxxx.json` が **Tunnel の本体認証情報**
* UUID が Tunnel ID

IDと.jsonファイル名をどこかにメモしておこう。
* * *
## 作成したトンネルを自分のドメインに紐づける
例えば、`app.example.com` を`my-tunnel`に割り当てる場合はコマンドは以下のようになる
```bash
cloudflared tunnel route dns my-tunnel app.example.com
```
* * *
## systemd 運用前提の正しい構成

#### 重要な設計方針

| 項目          |                             |
| ----------- | ----------------------------- |
| systemd 実行  | root 実行                       |
| config.yml  | `/etc/cloudflared/config.yml` |
| credentials | `/etc/cloudflared/*.json`     |
* * *
## 設定ディレクトリ作成
```bash
sudo mkdir -p /etc/cloudflared
sudo chown root:root /etc/cloudflared
sudo chmod 755 /etc/cloudflared
```
* * *
## credentials JSON を移動
```bash
sudo mv ~/.cloudflared/xxxxxxxx-xxxx.json /etc/cloudflared/
sudo chown root:root /etc/cloudflared/xxxxxxxx-xxxx.json
sudo chmod 600 /etc/cloudflared/xxxxxxxx-xxxx.json
```

※ `cert.pem` は移動させなくてもいいよ
* * *
## config.yml の作成
```bash
sudo vi /etc/cloudflared/config.yml
```

#### 最小構成例（HTTP 1サービス）
```yaml
tunnel: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: /etc/cloudflared/xxxxxxxx-xxxx.json

ingress:
  - hostname: app.example.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```
* * *
## 設定ファイル検証

```bash
sudo cloudflared tunnel ingress validate
```

エラーが出なければ OK
* * *
## systemd サービス登録
```bash
sudo cloudflared service install
```
#### 起動・自動起動
```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```
* * *
## 動作確認
ブラウザで以下へアクセスしてサーバーが表示されれば成功だ。

```text
https://app.example.com
```
* * *
## 複数サービス公開例

```yaml
ingress:
  - hostname: 01.example.com
    service: http://127.0.0.1:4616
  - hostname: 02.example.com
    service: http://127.0.0.1:4620
  - hostname: 03.example.com
    service: http://127.0.0.1:5000
  - service: http_status:404
```
