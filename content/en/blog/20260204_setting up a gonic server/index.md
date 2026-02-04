---
title: "Setting Up a gonic Server"
date: 2026-02-04
draft: false
translationKey: Setting-Up-a-gonic-Server
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## Hey guys!
It's Juke here.
This time, I tried setting up a gonic server.
I used Ubuntu Server version 22.04.3 on a Raspberry Pi.
Check out my video for an overview of the setup.
Alright, let's get started.
* * *
## Video
[![Video](cover.jpg)](https://youtu.be/xf4YiUaIYI0)
【Build】 Let's build a music streaming server with gonic! 【JUKE UNOTSUKI】
* * *
## Before You Begin
Everything written here is also in the official installation manual.
If you run into any issues, refer to that instead.
* ***Official Installation Manual***
https://github.com/sentriz/gonic/wiki/installation#with-systemd
* * *
## Installing Go
First things first: `apt update`.
```bash
sudo apt update
```
gonic requires Go version 1.25 or higher.
#### For the Latest OS
If you're running the latest OS, just run `apt install golang`.
```bash
sudo apt install golang
go version
```
#### If `apt install golang` fails to install Go 1.25
If your OS is outdated and `apt install golang` fails to install Go 1.25 or higher, download the binary and install it manually.

If an existing Go installation (via apt) exists, remove it first.
```bash
sudo apt remove -y golang-go golang
```
Double-check for any leftover files.
```bash
which go || true
```

Navigate to `/tmp`.
```bash
cd /tmp
```
Download Go 1.25.x.
The version downloaded here is the 64-bit edition for Raspberry Pi. For example, in an x64 environment, specify `go1.25.5.linux-amd64.tar.gz`.
```bash
wget https://go.dev/dl/go1.25.5.linux-arm64.tar.gz
```
If there is a `go` directory in `/usr/local/`, delete it.
```bash
sudo rm -rf /usr/local/go
```
Extract the downloaded go...
```bash
sudo tar -C /usr/local -xzf go1.25.5.linux-arm64.tar.gz
```
Set the PATH.
```bash
echo ‘export PATH=$PATH:/usr/local/go/bin’ >> ~/.profile
source ~/.profile
```
Verify the installation succeeded.
```bash
go version
```
* * *
## Installing Additional Dependencies
Install git / ffmpeg / mpv.
```bash
sudo apt install git ffmpeg mpv
```
* * *
## Installing gonic
#### If you installed Go with `apt install`
```bash
sudo GOBIN=/usr/local/bin go install go.senan.xyz/gonic/cmd/gonic@latest
```
#### If you installed Go manually
Specify Go using its full path.
```bash
sudo GOBIN=/usr/local/bin /usr/local/go/bin/go install go.senan.xyz/gonic/cmd/gonic@latest
```
Verify gonic installed correctly.
```bash
gonic -version
```
* * *
## Creating the Execution User, Directories, and Placing Configuration Files
#### Creating the gonic User
Create the user `gonic` for systemd daemonization.
```bash
sudo adduser --system --no-create-home --group gonic
```
#### Create Data and Configuration Directories
Create directories for data and configuration, then grant permissions to the `gonic` user.
```bash
sudo mkdir -p /var/lib/gonic/ /etc/gonic/
sudo chown -R gonic:gonic /var/lib/gonic/
```
#### Obtaining the Configuration File
Download the gonic configuration file.
```bash
sudo wget https://raw.githubusercontent.com/sentriz/gonic/master/contrib/config -O /etc/gonic/config
```
* * *
## Editing the Configuration File (Specifying Paths for Music Folders, etc.)

Edit the configuration file `/etc/gonic/config`.
```bash
sudo vi /etc/gonic/config
```
The configuration file requires specifying at least the following four settings:
* `listen-addr`: IP address and port number
* `music-path`: Path to the music folder
* `podcast-path`: Path to the podcast folder
* `playlist-path`: Path to the playlist folder
* * *
## Registering, Starting, and Checking the systemd Service
#### Download and Apply the Service File
```bash
sudo wget https://raw.githubusercontent.com/sentriz/gonic/master/contrib/gonic.service -O /etc/systemd/system/gonic.service
sudo systemctl daemon-reload
sudo systemctl enable --now gonic
```
#### Checking Service Status and Logs
```bash
systemctl status gonic
journalctl --follow --unit gonic
```
* * *
## Accessing the Admin Interface
Once it's running, try accessing the admin interface in your browser.
* `http://IP address of gonic:4747`
{{% drawing src="001.png" %}}
If you see the screen above, setup was successful!
gonic's default login is username `admin` and password `admin`.
After installation, **change the password as soon as possible**.
* * *
## Note
Machine translation is used for the sentence in this site.
Therefore, the sentence may contain mistranslations.
This site is not intended to cause you any discomfort.
Should any mistranslations appear in the site, I kindly ask for your understanding.
