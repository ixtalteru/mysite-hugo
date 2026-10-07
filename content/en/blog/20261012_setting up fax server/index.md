---
title: "Setting Up a Fax Server"
date: 2026-10-12T14:00:00+09:00
draft: false
translationKey: Setting-Up-Fax-Server
image: "cover.jpg"
categories: ["blog"]
tags: ["build", "server"]
---
## Hey everyone!
Juke here.
Today, I'll show you how to use **Fax Server Installer v1.0.0-rc20** to run a fax server on Ubuntu.

For an overview of the fax server, check out my video.
[![Video](cover.jpg)](https://youtu.be/5gH5kQdQ6ZA)
<p style="text-align: center;">
【Build】 Making a FAX machine. 【JUKE UNOTSUKI】
</p>

Send documents by email to have them faxed, and receive incoming faxes as PDFs. You'll set up this system by working through a series of numbered menus.
Instead of creating SIP and email configuration files by hand, you'll enter your connection details and let the installer handle installation and checks.
Let's start with the preparations and work through each step.
* * *
## Important Notices
- **To the extent permitted by law, the creator accepts no liability for damages arising from the use of this video or installer.**
- **This installer does not guarantee that faxing will work.**
- **This video does not guarantee that the installer will work.**
- **The creator will not accept any questions or feedback about the operation of the installer or fax system.**
- **You are solely responsible for installing, configuring, and operating this installer.**
- **Before using it for actual faxing, you must test both sending and receiving in your own environment.**
- **Do not use this system for emergency calls, applications involving the safety of life, health, or property, or any other purpose requiring high reliability.**

These are the terms for setting up this fax server.
Read them carefully and proceed only if you agree.
* * *
## Before You Begin
This article uses **1.0.0-rc20**. It's a release candidate still undergoing testing, rather than a final release.
Try it in an Ubuntu test environment first. If you already have a fax server running, prepare backups and a migration plan as well.
We'll start from the point where you can connect to Ubuntu over SSH and authenticate your administrator account using a public key.

### How to Read the Boxes in This Article
The headings on the boxes distinguish commands to run from examples that explain what appears on screen.
|Box heading|How to use it|
|---|---|
|**[Command to run]**|Copy it into the Ubuntu terminal and run it. The code block is marked `sh`|
|**[Screen example — do not run]**|An example of a screen shown by the installer. Do not execute the entire box; enter numbers or values in the installer you have already started|
|**[Menu sequence — do not run]**|Instructions showing which menus to select|
|**[Email example — do not run]**, etc.|Explanations of email content, filenames, or storage locations|

Screen examples appear in single-column tables with two rows: the screen heading on top and the screen content below. Commands use regular code blocks, so you can tell them apart by both their shape and their heading. Do not paste screen examples directly into a shell.
Menu numbers and labels match the RC20 implementation. These examples omit status information and some intermediate instructions; the values at the end illustrate what to enter. Placeholders such as `<…>` for passwords are explanatory and are not text you should actually type.
* * *
## What Can It Do?
To send a fax, email a request from a registered address to the dedicated fax email address. Put the recipient's fax number in the subject line, and the email body and attached documents will be sent as a fax.
For incoming faxes, the server converts faxes received over the SIP line into PDFs and emails them to registered recipients.
Here's how it works.

**[Diagram — do not run] Email and fax flow**
```text
[Sending]
User's email → Dedicated fax mailbox → Ubuntu server → SIP line → Recipient's fax machine

[Receiving]
Sender's fax machine → SIP line → Ubuntu server → PDF delivered by email
```

You can register authorized fax senders separately from recipients of incoming PDFs. You can also register the same address for both roles.
The main communication settings in RC20 are as follows.
|Item|Setting|
|---|---|
|Transmission speed|2400–9600 bps|
|Fax modem standards used|V.29 / V.27|
|ECM|Enabled, although negotiation with the other fax machine may result in non-ECM operation|
|Sending / receiving time limit|90 minutes|
|Wait after answering an incoming call|0 seconds|
|Wait before starting transmission|12 seconds|
|Document page limit|Up to 20 pages, including the email body and attachments|
|Concurrent calls|One call total, including both sending and receiving|

The 90-minute limit is a configured maximum. It does not mean that a full 90-minute transmission has been tested end to end.
* * *
## What You'll Need
### An Ubuntu Server
Supported combinations are Ubuntu 22.04, 24.04, or 26.04 on amd64.
You can check the OS and CPU architecture with these commands.

**[Command to run] Copy into the terminal and run**

```sh
cat /etc/os-release
dpkg --print-architecture
```

You'll also need an internet connection so the installer can download packages and source code.
### SIP Line Details
Have your connection details ready for MY050 or another supported SIP provider.
- SIP server name and port number
- Authentication username
- User ID
- Phone number to use for faxing
- SIP password

For other SIP providers, the installer supports username-and-password registration over UDP or TCP and faxing over G.711 audio. TLS, T.38-only lines, IP-based authentication, a separate outbound proxy, and specifying an IPv6 SIP server are not supported.
Being able to generate a configuration does not mean faxing will work with that provider, so test both sending and receiving at the end.
### Email Details
Prepare a dedicated fax email address and its IMAP and SMTP connection details.
|Item|What to prepare|
|---|---|
|Dedicated fax address|The email address that receives fax requests|
|IMAP|Server name, port, encryption mode, login name, password, and folder|
|SMTP|Server name, port, encryption mode, login name, and password|
|Authorized sender addresses|Email addresses of people allowed to request fax transmissions|
|Incoming PDF recipients|Email addresses that receive PDFs of incoming faxes|

Make sure you have credentials that work with your email service. Being able to log in to webmail does not necessarily mean you can use IMAP or SMTP.
The server also checks authentication results and signatures rather than trusting only the sender address text. Even with the correct connection details, you won't be able to go live until the signature verification requirements are met.
* * *
## Extract the Distribution Files
### Download

**FAX Server Installer 1.0.0-rc20**

- [Download the installer (fax-server-installer-1.0.0-rc20.tar.gz)](/distribution/fax-server-installer-1.0.0-rc20/fax-server-installer-1.0.0-rc20.tar.gz)
- [Download the SHA256 checksum](/distribution/fax-server-installer-1.0.0-rc20/fax-server-installer-1.0.0-rc20.tar.gz.sha256)

You'll need these two files.

**[Filenames — do not run] Distribution files to transfer**

```text
fax-server-installer-1.0.0-rc20.tar.gz
fax-server-installer-1.0.0-rc20.tar.gz.sha256
```

Transfer both files to the same directory on the Ubuntu server, then work from that directory.
First, check that the archive is intact.

**[Command to run] Copy into the terminal and run**

```sh
sha256sum -c fax-server-installer-1.0.0-rc20.tar.gz.sha256
```
If you see `OK`, extract it into a folder dedicated to RC20.

**[Command to run] Copy into the terminal and run**

```sh
mkdir -p ~/fax-installer-rc20
tar -xzf fax-server-installer-1.0.0-rc20.tar.gz -C ~/fax-installer-rc20
cd ~/fax-installer-rc20/fax-server-installer
```
If you have an older version, extract this one to a separate location rather than overwriting its folder.
Next, check the contents of the distribution.

**[Command to run] Copy into the terminal and run**

```sh
python3 -B faxsetup/cli.py check-bundle
```

Once the check passes, start the installer.

**[Command to run] Copy into the terminal and run**

```sh
sudo --preserve-env=SSH_CONNECTION bash install.sh
```
Preserving `SSH_CONNECTION` lets the installer check the firewall using your SSH connection later. Use this command when working over SSH.
* * *
## Work Through the Menus Starting with 1
The basic process has six steps.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── Setup Steps ──
1. Configure the administrator account and management device
2. Configure SIP details
3. Configure email and users
4. Save firewall settings (do not apply yet)
5. Install / update the server
6. Verify connections, apply the firewall, and go live
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

|Number|Menu|What it does|
|---|---|---|
|1|Configure the administrator account and management device|Register the account used for SSH administration and the allowed source network|
|2|Configure SIP details|Register the phone line connection details|
|3|Configure email and users|Register email connections and users|
|4|Save firewall settings|Save the SSH port and allowed source addresses|
|5|Install / update the server|Check the configuration and install the server|
|6|Verify connections, apply the firewall, and go live|Check external connections and start live operation|

In every menu, **0 means "Back / Exit."** Once you've finished configuring step 1, enter 0 to go back, then move on to step 2, and so on.
Saved settings remain even if you exit partway through, so you can resume later.

### 1. Configure the Administrator Account and Management Device
Enter the administrator account you already use for SSH and the source IP address or network range of your management device.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Example administrator account and management device settings</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">Existing administrator account: ubuntu
Saved.
Management device IP or network (e.g., 192.168.0.0/24) [&lt;current suggestion&gt;]: 192.168.0.0/24
Saved.</code></pre></td>
</tr>
</tbody>
</table>

`ubuntu` and `192.168.0.0/24` are examples. Replace the username with an existing administrator account and the source network with the one appropriate for your environment. The suggested value in brackets varies depending on your connection source and saved settings.
The administrator account here is the Ubuntu account you use to log in and configure the server, rather than the email address of someone sending faxes.
Choose a source address range that matches your network. Make sure it includes the management device you're currently using.

### 2. Configure SIP Details
Register the SIP server, authentication username, user ID, phone number, and password you prepared.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 2. Enter SIP Details ──
1. Use MY050 server settings
2. Other SIP provider: server / IP, port, and transport
3. SIP authentication username
4. SIP user ID
5. Fax phone number / extension
6. SIP password
7. Advanced: SIP domain and incoming call identifier
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

For MY050, select 1 to save the server settings, then enter your credentials in options 3–6. For another SIP provider, start with option 2 to configure the connection destination.
The authentication username and user ID may be the same or different, depending on the service. Check the details supplied by your provider instead of making assumptions.

### 3. Configure Email and Users
Register the dedicated fax email address and the IMAP and SMTP details.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 3. Fax Server Email Settings ──
1. Dedicated fax email address
2. Use Gmail (set server names automatically)
3. Incoming IMAP settings and password
4. Outgoing SMTP settings and password
5. Authorized senders and incoming fax recipients
6. Spam and spoofing protection
7. Move processed emails to the trash
0. Back / Exit
Number [0]: 2</code></pre></td>
</tr>
</tbody>
</table>

For Gmail, select 2 to set the server names, 1 to enter the dedicated fax address, and 3 and 4 to enter the login names and passwords. Selecting 2 alone does not fill in your credentials.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Example IMAP entries after selecting Gmail</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">IMAP server name [imap.gmail.com]:
Saved.
IMAP port [993]:
Saved.
IMAP login name: fax-account@example.com
Saved.
IMAP password: &lt;input hidden&gt;
Saved.</code></pre></td>
</tr>
</tbody>
</table>

The blank entries illustrate pressing Enter to keep the current value. `fax-account@example.com` is an example address; replace it with your own login name. Password characters are hidden on the actual screen.

Next, configure who can send faxes and who receives incoming PDFs.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── User Email Addresses ──
1. Add an email address
2. Change an existing user's permissions or address
3. Delete a user
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Example permissions when adding a user</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">Email address to add: user@example.com
Enable this user (y/n) [y]: y
Allow fax requests by email (y/n) [n]: y
Forward incoming fax PDFs to this address (y/n) [n]: y</code></pre></td>
</tr>
</tbody>
</table>

This example leaves out some intermediate explanations and enables both sending and receiving. If you want only one of these permissions, set the other to `n`.
For example, if one person handles both sending and receiving, register them for both roles. For someone who only needs to send faxes, grant only sending permission.
The on-screen counts for "addresses allowed to request fax transmissions" and "addresses receiving incoming PDFs" refer to registered email addresses. They do not indicate how many fax pages have been sent or how many faxes have been received.

### Keeping Previously Entered Details
Values such as SIP IDs and email addresses are not displayed as defaults, even when already saved. If an item is marked "Registered," simply press Enter to keep its saved value.
Enter a new value only when you want to change it. Password input is hidden.
However, email addresses you type and lists used to select users do appear on screen. Keep this in mind when recording a video or sharing your screen.

### 4. Save Firewall Settings
Save the SSH port and the range of IP addresses allowed to connect.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 4. Save Firewall Settings ──
1. Enter and save the SSH port and allowed IP addresses
2. Show saved settings
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

This step only saves the proposed settings; it does not change the active firewall yet. You'll apply them and check connectivity in step 6.
* * *
## Install the Server
Open **5. Install / update the server** from the main menu.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 5. Install / Update the Server ──
1. Check for missing configuration
2. Install using the settings saved in steps 1–4
3. Repair / update
4. Uninstall (keep data, settings, and SSH / firewall configuration)
5. Back up configuration
6. Restore a configuration backup
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

Start by selecting **1. Check for missing configuration**.
The installer checks required fields and their formats. If nothing is missing, it proceeds to pre-installation checks for the OS, free disk space, memory, the administrator's public key, APT dependencies, and other requirements.
If it finds a problem, return to the indicated settings and correct it.
An `OK` on this screen does not mean installation is complete. Downloading source code, building components, testing internal communication, and connecting to email require separate checks.
After checking your entries, select **2. Install using the settings saved in steps 1–4**.
Return to the same step 5 screen and enter `2` at the `Number [0]:` prompt.

Read the confirmation screen and proceed. Package installation, building fax modules, internal checks, and other tasks will begin. The installer displays each stage as it runs, so you can follow its progress while you wait.
When installation finishes, the status is **STAGED**.
This means the server has been installed and is waiting to go live. Keep going and proceed to step 6.
* * *
## Verify Connections and Go Live
Open **6. Verify connections, apply the firewall, and go live** from the main menu, then select **1. Proceed step by step**.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Enter a number on the displayed screen</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 6. Verify Connections, Apply the Firewall, and Go Live ──
1. Proceed step by step / resume an interrupted step
2. Confirm the firewall trial from a new SSH connection and continue
3. Detailed operational checks
4. Manage the firewall after installation
5. Add / remove sending and receiving email addresses and apply settings
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

You'll work through email connection checks, applying settings, a firewall trial, and starting live operation.
If verification results need to be applied to the server along the way, the installer handles that at the appropriate point. You don't need to return to step 5 and reinstall.

### If Email Signature Verification Stops the Process
If the installer cannot automatically verify signatures or authentication results from emails in the inbox, it stops and displays the reason.
Follow the on-screen instructions, prepare any required test emails or settings, and then resume. Do not manually mark an unchecked item as "Verified" just because the connection works.

### Confirm the Firewall from a Separate SSH Connection
This step matters.
When the firewall trial begins, **keep your current SSH connection open and establish a new SSH connection from another terminal**.
In the new connection, go to the same RC20 folder and start the installer.

**[Command to run] Copy into the terminal and run**

```sh
cd ~/fax-installer-rc20/fax-server-installer
sudo --preserve-env=SSH_CONNECTION bash install.sh
```

Then select the following options.

**[Menu sequence — do not run] Order of menu selections**

```text
6. Verify connections, apply the firewall, and go live
  → 2. Confirm the firewall trial from a new SSH connection and continue
```

Enter the trial ID shown on the original screen to continue through to live operation from the new connection.
In the new connection, enter `2` at the `Number [0]:` prompt on the same step 6 screen. Use the actual trial ID displayed at that time.
You must confirm the trial within five minutes. If it isn't confirmed, the system restores the previous firewall and SSH settings.
Keeping an existing connection open doesn't tell you whether a new SSH connection can be established with the new settings. That's why opening a separate connection is necessary.

### Switching from an Older Server
Before the new server goes live, stop any older fax server using the same SIP account or mailbox.
This prevents two servers from handling the same line or email at the same time.
When the server goes live for the first time, emails already in the inbox are excluded from fax requests. This prevents old emails from being sent as faxes in a batch.
The server also does not start receiving external faxes before going live. Follow the screens through to the end and confirm that the status becomes `ACTIVE`.
* * *
## Try Sending a Fax
Send an email from an address registered as an authorized sender to the dedicated fax address.
Here's how to compose it.

**[Email example — do not run] What to enter in your email composer**

```text
From: Your email address registered as an authorized sender
To: The dedicated fax email address you configured
Subject: The recipient's fax number, using only ASCII digits (0–9)
Attachment: The PDF you want to send
```

The subject must be **the recipient's fax number itself**, rather than a title such as "Quotation." Do not include hyphens, spaces, or text such as "FAX:".
Rules also allow or block certain domestic numbers, so a number containing only digits is not automatically permitted.
If the email body contains text, it becomes part of the fax document too. If you want to send only the PDF, check that the body doesn't contain an automatic signature or other unwanted content.
The combined limit for the body and attachments is 20 pages. For your first test, use a one-page document and a destination where you can check the received fax yourself.
After sending, check the result notification and have the recipient verify the page count and content. Repeatedly resending the same request without knowing the result can cause duplicate transmissions. The system is designed not to redial automatically, so check what happened first.
* * *
## Try Receiving a Fax
Send a document from another fax machine to the fax number you configured.
Check that a PDF arrives at the email address registered to receive incoming fax PDFs.
There's more to check than whether an email arrived.

- Can you open the PDF?
- Is the page count correct?
- Are all text and graphics intact?
- Did it arrive at the intended forwarding address?

An SMTP server accepting an email does not mean it has reached the recipient's mailbox. Verify its final delivery, including checking the spam folder.
* * *
## Adding or Removing Users
To change addresses after going live, open **6 → 5**.

**[Menu sequence — do not run] Order of menu selections**

```text
6. Verify connections, apply the firewall, and go live
  → 5. Add / remove sending and receiving email addresses and apply settings
```

This screen has the following options.

<table style="width: 100%; border-collapse: collapse; background-color: #000000; color: #ffffff; border: 1px solid #555555;">
<tbody>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><strong style="color: #ffffff;">[Screen example — do not run] Manage sending and receiving email addresses</strong></td>
</tr>
<tr style="background-color: #000000; color: #ffffff;">
<td style="padding: 12px 16px; background-color: #000000; color: #ffffff; border: 1px solid #555555;"><pre style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; white-space: pre; overflow-x: auto; font-family: monospace; line-height: 1.6;"><code style="padding: 0; background-color: #000000; color: #ffffff; font-family: inherit;">── 6-5. Manage Sending and Receiving Email Addresses ──
1. Add an authorized sender email address
2. Remove an authorized sender email address
3. Add an email address for incoming fax PDFs
4. Remove an email address for incoming fax PDFs
5. Apply saved settings
0. Back / Exit
Number [0]: 1</code></pre></td>
</tr>
</tbody>
</table>

To register an address for both sending and receiving, add it separately using options 1 and 3.
Adding or removing an address does not immediately change the live configuration. Check the lists of "Pending additions" and "Pending removals," then select **5. Apply saved settings**.
The server temporarily pauses fax processing while it applies and checks the settings. Do this when no one is using the fax system, and follow the screens until live operation resumes.
Any other saved changes that haven't been applied will be applied at the same time. Even if you intended only to change users, review the full set of changes.
* * *
## Updating an Older Version to RC20
The process differs slightly from a fresh installation.
First, make sure no faxes are being processed and take any necessary backups. Then extract RC20 into a folder separate from the older version and start it.
Saved settings carry over, but you'll need to re-enter any secret values that weren't saved by the older version.
Work through the menus in this order.

**[Menu sequence — do not run] Order of menu selections**

```text
5. Install / update the server
  → 3. Repair / update

After installation finishes
  → 6. Verify connections, apply the firewall, and go live
```

After updating, continue through connection verification and starting live operation; installing the server alone isn't enough.
Step 5 also includes configuration backups. These are not full server backups containing fax images, the operational database, or keys used to prevent duplicate processing. If you need to restore history as well, back up that data separately.
* * *
## Troubleshooting
If installation fails, the screen shows `FAILED`, the stage that failed, the reason, and the location of a detailed log.
Start by reading that screen. Checking where the process stopped makes it easier to identify the cause than repeatedly entering everything again from scratch.
Detailed logs are saved in this directory.

**[Storage location — do not run] Directory containing logs**

```text
/var/lib/faxmail-installer/errors/
```

Check the log filename shown on screen and read that file with administrator privileges. Review its contents before sharing it with anyone.
Here are some common points of confusion.

|Situation|What to check first|
|---|---|
|Input checks pass, but installation fails|Which stage stopped: source download, APT dependencies, building, or internal tests|
|Status remains STAGED|Whether connection verification and starting live operation in step 6 are complete|
|Email authentication stops the process|Whether incoming email signatures and authentication results can be verified, in addition to the connection details|
|Cannot confirm the firewall trial|Whether you are using a separate, new SSH connection, the correct trial ID, and are within the time limit|
|A newly added user cannot send faxes|Whether you selected "Apply settings" after saving the address|
|Incoming PDFs do not arrive|Recipient registration, whether settings were applied, email delivery results, and the spam folder|

A previous `FAILED` status does not become a success simply because input checks pass. The status becomes `STAGED` once the actual installation completes.
* * *
## Wrapping Up
This installer guides you through saving connection details, installing the server, verifying it, and then going live.
For the initial setup, follow **1 → 2 → 3 → 4 → 5 → 6**. Even after installation finishes, `STAGED` means you're still partway through.
Once you've confirmed the firewall from a separate SSH connection and started live operation, finish by checking actual fax transmissions and email delivery.
If you'd like to send faxes from your email and read incoming faxes as PDFs, give it a try in an Ubuntu test environment first.
