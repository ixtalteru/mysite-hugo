---
title: "gonicサーバーの構築"
date: 2026-02-04
draft: false
translationKey: Setting-Up-a-gonic-Server
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## やぁみんな。
ジュークだよ。
今回は、gonicサーバーの構築に挑戦したよ。
設定したのはRaspberryPiのUbuntuサーバーのバージョン22.04.3だ。
構築の概要は、おいらの動画を見てくれ。
それじゃぁ行ってみよー。
* * *
## 動画
[![Video](cover.jpg)](https://youtu.be/xf4YiUaIYI0)
【構築】 gonic で 音楽ストリーミングサーバー を 作ろう! 【宇ノ月ジューク / JUKE UNOTSUKI】
* * *
## 最初に
ここに書いてあることは、全部公式のインストールマニュアルに書いてある。
何かあったらコッチを参考にしてくれ。
* ***公式インストールマニュアル***
https://github.com/sentriz/gonic/wiki/installation#with-systemd
* * *
## Go言語のインストール
何はなくとも最初は`apt update`だ。
```bash
sudo apt update
```
gonicにはgoのバージョン1.25以上を必要とする。
#### 最新のOSの場合
最新のOSの場合は`apt install golang`だけでOKだ。
```bash
sudo apt install golang
go version
```
#### `apt install golang`でgoのバージョン1.25がインストールできなかった場合
OSが古かったりで1.25以上のバージョンのgoがインストールできなかった場合はバイナリをダウンロードしてインストールしよう。

既存の go（apt版）があれば削除しよう。
```bash
sudo apt remove -y golang-go golang
```
念のため残骸が残っていないか確認する。
```bash
which go || true
```

一度、`/tmp`へ移動する。
```bash
cd /tmp
```
go 1.25.xをダウンロードしよう。
ここでダウンロードしているのはRaspberry Pi用の64bit版だから、例えばx64環境なら`go1.25.5.linux-amd64.tar.gz`などを指定する。
```bash
wget https://go.dev/dl/go1.25.5.linux-arm64.tar.gz
```
`/usr/local/`に`go`ディレクトリがある場合は、削除しておく。
```bash
sudo rm -rf /usr/local/go
```
ダウンロードしたgoを解凍して...
```bash
sudo tar -C /usr/local -xzf go1.25.5.linux-arm64.tar.gz
```
PATHを設定しよう。
```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
source ~/.profile
```
ちゃんとインストールできたか確認する。
```bash
go version
```
* * *
## 追加依存パッケージのインストール
git / ffmpeg / mpv をインストールしよう。
```bash
sudo apt install git ffmpeg mpv
```
* * *
## gonic のインストール
#### `apt install`でgoをインストールした場合
```bash
sudo GOBIN=/usr/local/bin go install go.senan.xyz/gonic/cmd/gonic@latest
```
#### 手動でgoをインストールした場合
goをフルパスで指定してやる。
```bash
sudo GOBIN=/usr/local/bin /usr/local/go/bin/go install go.senan.xyz/gonic/cmd/gonic@latest
```
gonicが正常にインストールできたか確認しよう。
```bash
gonic -version
```
* * *
## 実行ユーザーの作成、ディレクトリの作成、設定ファイルの配置
#### gonic ユーザーの作成
systemd 常駐用に、ユーザー `gonic` を作ろう。
```bash
sudo adduser --system --no-create-home --group gonic
```
#### データ用 / 設定用ディレクトリの作成
データ用と設定用ディレクトリを作成して、ユーザー `gonic` に権限を与える。
```bash
sudo mkdir -p /var/lib/gonic/ /etc/gonic/
sudo chown -R gonic:gonic /var/lib/gonic/
```
#### 設定ファイルの取得
gonicの設定ファイルをダウンロードする。
```bash
sudo wget https://raw.githubusercontent.com/sentriz/gonic/master/contrib/config -O /etc/gonic/config
```
* * *
## 設定ファイルの編集（音楽フォルダ等のパスを指定）

設定ファイル `/etc/gonic/config` を編集しよう。
```bash
sudo vi /etc/gonic/config
```
設定ファイルは最低限以下の四か所を指定する必要がある
* `listen-addr`：IPアドレスとポート番号
* `music-path`：音楽フォルダのパス
* `podcast-path`：ポッドキャストフォルダのパス
* `playlist-path`：プレイリストフォルダのパス
* * *
## systemdサービスの登録、起動、確認
#### サービスファイルをダウンロードして反映
```bash
sudo wget https://raw.githubusercontent.com/sentriz/gonic/master/contrib/gonic.service -O /etc/systemd/system/gonic.service
sudo systemctl daemon-reload
sudo systemctl enable --now gonic
```
#### 起動状態とログ確認
```bash
systemctl status gonic
journalctl --follow --unit gonic
```
* * *
## 管理画面にアクセス
起動できたら、ブラウザで管理画面にアクセスしてみよう。
* `http://gonicのIPアドレス:4747`
{{% drawing src="001.png" %}}
上記の画面が出れば構築成功だ！
gonic のデフォルトログインはユーザー名が`admin`、パスワードも`admin`だ。
導入後は、**できるだけ早くパスワード変更**してくれ。
