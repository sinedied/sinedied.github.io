---
title: "Replacing gmailify: 3 days configuring, 30 minutes coding"
published: true
description: "How I replaced Google's deprecated gmailify with a tiny Go tool running on my Synology NAS... and why sometimes building your own is faster than configuring the alternatives."
tags: go, docker, ai, selfhosted
cover_image: ''
date: '2026-04-10T14:00:00Z'
---

Google killed [gmailify](https://support.google.com/mail/answer/16604719). If you don't know what that was: it let you pull emails from non-Gmail accounts directly into your Gmail inbox, spam filtering included. Simple, reliable, invisible. And now it's gone.

I have a few email accounts that I want flowing into my Gmail. I also have an old Synology NAS sitting in a corner, running 24/7, doing very little. The plan was simple: find a Docker container that does IMAP forwarding, deploy it on the NAS, move on with life.

That plan didn't survive first contact with reality. ☕

## TL;DR

- Google deprecated gmailify, and existing self-hosted alternatives were a nightmare to configure
- AI tools (ChatGPT, Gemini, Copilot) all hallucinated non-existent Docker images for existing tools
- I built [**imapforward**](https://github.com/sinedied/imapforward) in under 30 minutes with AI help, and it's been running flawlessly on my Synology NAS
- Rewrote it from Node.js to Go, dropping from ~50MB to ~12MB peak RAM
- Found three forwarding approaches: IMAP append (headers preserved, no spam filter), SMTP (spam filter, sender rewritten), Gmail API (best of both worlds)

If you find the project useful, don't forget to give it a ⭐️ on [GitHub](https://github.com/sinedied/imapforward)!

## The 3 days I'll never get back

I started the way any reasonable developer would: by looking at what already exists. I asked ChatGPT, Gemini, and GitHub Copilot for options. They all suggested the reasonable tools: **fetchmail**, **getmail**, **imapsync**, **Synology MailPlus**. Classic, well-known tools. Sounds great.

Except none of them worked.

Not because the tools themselves are bad. They've been around forever and clearly work for people. But *finding a maintained, minimal Docker image* to run them turned out to be way harder than it should be. And here's where it got really frustrating: every AI assistant I tried confidently recommended Docker images that **did not exist**. Not outdated. Not deprecated. Flat-out hallucinated.

```
$ docker pull fetchmail/fetchmail:latest
Error response from daemon: pull access denied for fetchmail/fetchmail, repository does not exist
```

*Every. Single. Time.*

I'd get a confident recommendation, try it, hit a wall. Ask for an alternative, get another hallucinated image. Adjust the config the AI suggested, still broken. Try a different tool, same story. The configurations were never quite right for the few real images I could find, and keeping track of which versions matched which config syntax was a mess.

Three full days of this. Three days of copy-pasting configs, debugging TLS handshakes, fighting YAML indentation, and wondering if I was losing my mind. Even Synology MailPlus, which should've been the easiest path on my NAS, turned out to be a pain to set up for simple forwarding.

## 30 minutes to "it works"

After three days, I gave up on existing tools and did the thing developers do best: wrote my own.

I opened a chat with GitHub Copilot and described what I wanted: a Node.js CLI app that connects to multiple IMAP accounts, watches for new emails using IMAP IDLE, and appends them to my Gmail inbox. Simple, focused, nothing fancy.

In under 30 minutes I had a fully working app. With a `Dockerfile`. And a CI/CD pipeline deploying the image to GitHub Container Registry.

The contrast was almost comical. Three days fighting with established tools, versus half an hour to build exactly what I needed from scratch.

## The NPM publishing detour

What *did* take longer than expected was setting up NPM trusted publishing with OIDC on GitHub Actions. I wanted `semantic-release` to handle versioning and publish automatically, which meant getting OIDC token exchange working between GitHub and npm.

The catch? It required the absolute latest of *everything*: latest Node.js, latest GitHub Actions, latest npm dependencies. I wasted a solid chunk of time wondering why things weren't working, only to realize I was running Node 22 instead of Node 24. The bundled npm version in Node 22 didn't support the OIDC flow properly.

One version bump later, everything clicked. Not a huge deal in hindsight, but one of those "the error message tells you nothing useful" situations.

## Two months of silence (the good kind)

I deployed the container on my Synology, pointed it at my email accounts, and... forgot about it.

For two months. It just worked. IMAP IDLE meant emails showed up in Gmail within seconds. No crashes, no disconnections that didn't auto-recover, no maintenance. The kind of boring reliability you want from infrastructure.

## Time for an upgrade

After two months of quiet success, I decided to revisit the project. My initial approach, IMAP append, preserved all email headers perfectly but it also bypassed Gmail's spam filter entirely. My other mailboxes don't get *tons* of spam, but enough to be annoying.

### Attempt 2: SMTP forwarding

First I tried SMTP forwarding: send the message through Gmail's SMTP server instead of appending it via IMAP. This routes through the spam filter, great! But Gmail rewrites the `From` header to match the authenticated sender. So in my email list, every forwarded message appeared to be from *me*. Reply-To headers are set correctly so replies still work, but the inbox view is cluttered with my own name. Not ideal.

### Rewriting to Go

While I was at it, I decided to convert the whole project from Node.js to Go. The Node.js version wasn't *heavy*, but ~50MB peak RAM felt like a lot for something that just shuffles emails around.

The rewrite with GitHub Copilot was smooth, and Go is a natural fit for this kind of long-running, low-resource service. Copilot handled the conversion well, and the automated PR review caught a few edge cases I missed. The result? **~12MB peak RAM**. That's more like it for my aging NAS. As a bonus, the docker image size also dropped significantly, from ~170MB to just 14MB. Wasn't really an issue, but hey this feels good.

### Attempt 3: Gmail API (the winner)

I kept searching for a way to have *both* header preservation *and* spam filtering. Turns out the [Gmail API `messages.import`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/import) endpoint does exactly this. It's literally what gmailify used to do under the hood.

The setup is more involved: you need a Google Cloud project, OAuth2 credentials, and you have to manually go through the consent flow to get a refresh token. But once that's done, it's the best of both worlds: full original headers preserved, and Gmail's spam filter processes every message. Exactly like the old gmailify.

I added a built-in helper command to make the OAuth2 setup less painful:

```bash
imapforward -auth \
  -auth-client-id "YOUR_CLIENT_ID" \
  -auth-client-secret "YOUR_CLIENT_SECRET"
```

This opens your browser, handles the consent flow, and spits out the config block you need. Copy, paste, done.

## Running it

If you want to try it yourself, it's a single Docker container with a JSON config file:

```bash
docker run -d \
  --name imapforward \
  -v $(pwd)/config.json:/app/config.json:ro \
  --restart unless-stopped \
  ghcr.io/sinedied/imapforward:latest
```

There's also an [online configuration generator](https://sinedied.github.io/imapforward/#config) if you don't want to write JSON by hand. The tool supports all three forwarding methods, so you can pick what works for your situation.

## On building vs. configuring

Yeah, I know. "Don't reinvent the wheel." "You'll have to maintain it." I've been maintaining open source projects for 15 years, so I know a thing or two about maintenance burden 😏

But sometimes the wheel doesn't fit your car. I genuinely spent *more* time trying to configure existing tools than I did building, testing, rewriting, and deploying my own from scratch. And the result does exactly what I need, nothing more, nothing less.

Maintenance burden is also less of a concern these days, somehow. AI coding agents make it realistic to keep a small, focused tool like this up to date without it becoming a second job. It's not *zero* effort, but it's manageable.

The real lesson? Don't be afraid to build your own when the alternatives fight you at every step. Sometimes the fastest path forward is a blank editor and a clear idea of what you actually need.

## Going further

- 📦 **GitHub repo**: [sinedied/imapforward](https://github.com/sinedied/imapforward)
- 🐳 **Docker image**: [ghcr.io/sinedied/imapforward](https://github.com/sinedied/imapforward/pkgs/container/imapforward)
- 🔧 **Config generator**: [sinedied.github.io/imapforward](https://sinedied.github.io/imapforward/#config)

If you're in the same boat with gmailify being gone, give it a try.
