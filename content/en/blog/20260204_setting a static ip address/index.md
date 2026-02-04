---
title: "Setting a Static IP Address"
date: 2026-02-04
draft: false
translationKey: Setting-Static-IP
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## Hey guys!
It's Juke here.
This time, we're going to set a static IP address on an Ubuntu server.
The version I'm using is Ubuntu Server 22.04.3.
Alright, let's get started.
* * *
## Checking networkd
Ubuntu should use networkd for IP management, but let's first confirm if networkd is actually enabled.
```console
sudo systemctl is-active systemd-networkd
```
If the result is `active`, networkd is being used.
* * *
## Checking the Network Interface
The simplest way is:
```console
ip a
```
Running the above command will display information like this:
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
Note the notation for the `eth0` part displayed here.
* * *
## Creating the Network Configuration File
Once you know the network interface, navigate to the `/etc/netplan/` directory.
```console
cd /etc/netplan/
```
Next, create the configuration file.
```console
sudo vi 99-netcfg.yaml
```
The filename of the configuration file can remain as is.
Here, we're using the vi editor to edit the file, but feel free to use whichever editor you find most comfortable.
The contents to enter into the configuration file are as follows.
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
In the example above, specify the network interface you identified with `ip a` for the `eth0` section.
Replace `- 192.168.0.205/24` with the IP address you want to configure.
Specify your router's IP address for the two instances of `192.168.0.1`.
* * *
## Applying the Configuration
After saving the configuration file, apply the settings with the following command.
```console
sudo netplan apply
```
If you're configuring via SSH, the IP address will change when the settings are applied, so your SSH connection should disconnect.
* * *
## Verifying the IP Address
To confirm the IP address changed correctly, enter the following command:
```console
ip a
```
Yes, it's the same command used to check the network interface.
Enter the above command. If the IPv4 address starting with `inet` matches the one you set, the configuration was successful!
* * *
## Note
Machine translation is used for the sentence in this site.
Therefore, the sentence may contain mistranslations.
This site is not intended to cause you any discomfort.
Should any mistranslations appear in the site, I kindly ask for your understanding.
