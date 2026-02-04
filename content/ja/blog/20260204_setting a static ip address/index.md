---
title: "IPの固定について"
date: 2026-02-04
draft: false
translationKey: Setting-Static-IP
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
# IPの固定について
やぁみんな。
ジュークだよ。
今回は、UbuntuサーバーのIPアドレスを固定していくよ。
設定したのはUbuntuサーバーのバージョン22.04.3だ。
それじゃぁ行ってみよー。
* * *
## networkdの確認
UbuntuはIPの制御にnetworkdを使用しているはずなんだけど、一度本当にnetworkdが有効かどうか確認しよう。
```console
sudo systemctl is-active systemd-networkd
```
結果が`active` なら、networkdが使用されていることになる。
* * *
## ネットワークインターフェースの確認
一番簡単なのが
```console
ip a
```
上記のコマンドを入力すると、例えば下記のような情報が表示される。
```console
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host noprefixroute
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:00:15:18 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.205/24 metric 100 brd 192.168.0.255 scope global dynamic eth0
       valid_lft 244707sec preferred_lft 244707sec
    inet6 fe80:::::1234/64 scope link
       valid_lft forever preferred_lft forever
```
ここで、表示される`eth0`の部分の表記をメモしておく。
* * *
## ネットワーク設定ファイルの作成
ネットワークインターフェースが分かったら、`/etc/netplan/`ディレクトリへ移動する。
```console
cd /etc/netplan/
```
次に設定ファイルを作成する。
```console
sudo vi 99-netcfg.yaml
```
設定ファイルのファイル名はそのままで構わない。
ここではファイルの編集にviエディタを使用しているけど、みんなの使いやすいエディタを指定してくれ。
記入する設定ファイルの中身は下記のようになる。
```console
network:
  version: 2
  ethernets:
    eth0:
      optional: true
      dhcp4: false
      dhcp6: false
      addresses:
        - 192.168.0.205/24
      routes:
        - to: default
          via: 192.168.0.1
      nameservers:
        addresses:
          - 192.168.0.1
```
上記の例の`eth0`の所は`ip a`で調べたネットワークインターフェースを指定する。
`- 192.168.0.205/24`の所は自分の設定したいIPアドレスへ書き換える。
二か所の`192.168.0.1`の所は自分のルーターのIPアドレスを指定する。
* * *
## 設定の反映
設定ファイルを保存したら下記のコマンドで設定を反映する。
```console
sudo netplan apply
```
もしSSH経由で設定している場合、設定を反映した時点でIPアドレスが書き換わるからSSHの接続は途切れるはずだ。
* * *
## IPアドレスの確認
IPアドレスが正常に変更されたか確認するには下記のコマンドを入力する。
```console
ip a
```
そう、ネットワークインターフェースの確認に用いたコマンドと一緒だ。
上記のコマンドを入力して、`inet`から始まるIPv4のアドレスが設定したものと一緒なら設定は成功だ！
