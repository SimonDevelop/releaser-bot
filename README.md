[![version](https://img.shields.io/badge/Version-0.1.0-brightgreen.svg)](https://github.com/SimonDevelop/releaser-bot/releases/tag/0.1.0)
[![Minimum Node Version](https://img.shields.io/badge/node-%3E%3D%206-brightgreen.svg)](https://nodejs.org/en/)
[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/SimonDevelop/releaser-bot/blob/master/LICENSE)
# releaser-bot
Simple bot that handles release generation on github projects.

## How it works
The bot will just listen to the webhooks of your projects github, is a push is detect and the message of the commit corresponds to the one configured in your config.json, it will create a new release on this commit.

With your type message commit in config.json, use `patch`, `minor` and `major` to specify the release.

## Install
```bash
$ npm install
$ cp config.example.json config.json
```
Edit `config.json` for your personal token github of bot account, trigger commit message and your github repositories.

## Run
```bash
$ npm start
```

## Webhooks
Add the address of your nodejs server to the webhooks of your github projects classified in your config.json file.
Specify the content type on application/json and check `Just the push event.`.

## TODO
 - [x] Simple release creation
 - [ ] Add description release
