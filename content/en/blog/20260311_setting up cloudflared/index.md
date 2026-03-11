---
title: "Setting Up Cloudflare Tunnel"
date: 2026-03-11
draft: false
translationKey: Setting-Up-Cloudflared
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## Hey guys!
It's Juke here.
This time, I tried publishing a gonic server using Cloudflare Tunnel.
I set it up on a Raspberry Pi running Ubuntu Server version 22.04.3.
Check out my video for an overview of the setup.

[![Video](cover.jpg)](https://youtu.be/Y_bi8KQxpRU)
【Build】 Make your server public with Cloudflare Tunnel! 【JUKE UNOTSUKI】

Alright, let's get started.
* * *
## Prerequisites
* You have a Cloudflare account
* You own at least one custom domain
* * *
## Installing cloudflared (Official APT)
We'll install cloudflared from the official Cloudflare repository.
#### Registering the “Signature Key” for Securely Using Cloudflare's APT Repository on Ubuntu
```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
 | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
```
#### Register the official package distribution server for cloudflared on Ubuntu
```bash
 echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
https://pkg.cloudflare.com/cloudflared$(lsb_release -cs) main" \
| sudo tee /etc/apt/sources.list.d/cloudflared.list
```
#### apt update
```bash
sudo apt update
```
#### Install cloudflared
```bash
sudo apt install -y cloudflared
```
#### Verify successful installation
```bash
cloudflared version
```
* * *
## Log in to Cloudflare Tunnel
Once cloudflared is installed, log in to Cloudflare.
```bash
cloudflared tunnel login
```

* Copy the displayed URL
* Launch your browser
* Log in to Cloudflare
* Paste the copied URL into your browser
* Select the domain you want to use

If successful, the following directory and file will be created:

```text
~/.cloudflared/cert.pem
```

* `cert.pem` is **only used when creating a Tunnel**

---

## Creating a Tunnel
Once logged into Cloudflare, create your tunnel.
```bash
cloudflared tunnel create my-tunnel
```
Replace `my-tunnel` with any name you like.

Upon success, a .json file will be created in `.cloudflared`.
```text
Tunnel credentials written to ~/.cloudflared/xxxxxxxx-xxxx.json
```

* `xxxxxxxx-xxxx.json` contains the **core Tunnel credentials**
* The UUID is the Tunnel ID

Make a note of the ID and the .json filename somewhere.
* * *
## Assigning the Created Tunnel to Your Domain
For example, to assign `app.example.com` to `my-tunnel`, use the following command:
```bash
cloudflared tunnel route dns my-tunnel app.example.com
```
* * *
## Correct Configuration for systemd Operation

#### Key Design Principles

| Item          |                             |
| ----------- | ----------------------------- |
| systemd Execution  | root Execution                       |
| config.yml  | `/etc/cloudflared/config.yml` |
| credentials | `/etc/cloudflared/*.json`     |
* * *
## Create Configuration Directory
```bash
sudo mkdir -p /etc/cloudflared
sudo chown root:root /etc/cloudflared
sudo chmod 755 /etc/cloudflared
```
* * *
## Move credentials JSON
```bash
sudo mv ~/.cloudflared/xxxxxxxx-xxxx.json /etc/cloudflared/
sudo chown root:root /etc/cloudflared/xxxxxxxx-xxxx.json
sudo chmod 600 /etc/cloudflared/xxxxxxxx-xxxx.json
```

※ You don't need to move `cert.pem`
* * *
## Create config.yml
```bash
sudo vi /etc/cloudflared/config.yml
```

#### Minimal Configuration Example (HTTP 1 Service)
```yaml
tunnel: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: /etc/cloudflared/xxxxxxxx-xxxx.json

ingress:
  - hostname: app.example.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```
* * *
## Validate Configuration File

```bash
sudo cloudflared tunnel ingress validate
```

If no errors appear, it's OK
* * *
## Register systemd Service
```bash
sudo cloudflared service install
```
#### Start & Enable Auto-Start
```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```
* * *
## Verify Operation
Access the following URL in your browser. If the server appears, it's successful.

```text
https://app.example.com
```
* * *
## Example of Publishing Multiple Services

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
* * *
## Note
Machine translation is used for the sentence in this site.
Therefore, the sentence may contain mistranslations.
This site is not intended to cause you any discomfort.
Should any mistranslations appear in the site, I kindly ask for your understanding.
