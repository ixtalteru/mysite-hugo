---
title: "Setting Up Key-Based Authentication for SSH Login"
date: 2026-02-04
draft: false
translationKey: Setting-Up-Key-Based-Authentication-for-SSH-Login
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## Hey guys!
It's Juke here.
This time, I set up key-based authentication for SSH connections on my Ubuntu server.
The version I configured is Ubuntu Server 22.04.3.
Alright, let's get started.
* * *
## Generating SSH Keys
This time, I'll be using Tera Term for the work.
{{% drawing src="001_en.png" %}}
First, after opening Tera Term, cancel the connection once.
{{% drawing src="002_en.png" %}}
Click “Generate SSH Key” from the Settings menu bar...
{{% drawing src="003_en.png" %}}
Select “ED25519” for the key type and click Generate.
{{% drawing src="004_en.png" %}}
This will save your SSH public key and private key, so save them.
Since you're using key authentication, losing the keys will prevent you from logging into the server, so be careful not to lose them.
After saving the public and private keys, close Tera Term once.
* * *
## Setting Up the SSH Public Key
{{% drawing src="005_en.png" %}}
When you reopen Tera Term, click “OK” to log in.
{{% drawing src="006_en.png" %}}
When logging in, please uncheck “Add this host to the known hosts file (A)” and click “Continue”.
After that, log in normally using password authentication.
{{% drawing src="007_en.png" %}}
Once logged into the server, drag and drop the public key you saved earlier into Tera Term.
{{% drawing src="008_en.png" %}}
A dialog like the one above will appear. Just click “OK” without doing anything.

Next, we'll move the public key we placed on the server into the .ssh folder. But first, let's back up the existing authorized_keys file in the .ssh folder.
```
mv .ssh/authorized_keys .ssh/default_authorized_keys
```
Rename id_ed25519.pub and move it into the .ssh folder...
```
sudo mv id_ed25519.pub .ssh/authorized_keys
```
Change the file and directory permissions
```
sudo chmod 700 .ssh
sudo chmod 600 .ssh/authorized_keys
```
* * *
## Modifying Configuration Files
Before changing settings, back up the original configuration files.
```
sudo cp /etc/ssh/sshd_config /etc/ssh/backup_sshd_config
```
Now edit the configuration file.
This time we're using vi as the editor, but feel free to use whichever editor you find easiest.
```
sudo vi /etc/ssh/sshd_config
```
We'll edit the following three points:
The port number, disabling root login, and disabling password authentication.
```
Port 1975
PermitRootLogin no
PasswordAuthentication no
```
After saving the configuration file, restart ssh.
* For Ubuntu 22
```
sudo systemctl restart sshd
```
* For Ubuntu 24
```
sudo systemctl restart ssh
```

* * *
## Verify Operation
{{% drawing src="009_en.png" %}}
Open Tera Term and log in as usual.
{{% drawing src="010_en.png" %}}
Again, make sure the checkbox for “Save this host to the known hosts list (A)” is unchecked...
{{% drawing src="011_en.png" %}}
This time, try logging in by selecting the saved private key instead of entering the password.
{{% drawing src="012_en.png" %}}
If you can log in without any issues, your key authentication setup is complete!
* * *
## Note
Machine translation is used for the sentence in this site.
Therefore, the sentence may contain mistranslations.
This site is not intended to cause you any discomfort.
Should any mistranslations appear in the site, I kindly ask for your understanding.
