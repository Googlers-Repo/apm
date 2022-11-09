[nodejs]: https://github.com/Googlers-Repo/node
[foxmmm]: https://github.com/Fox2Code/FoxMagiskModuleManager

<p  align="center"><img width="140" src="https://dergoogler.com/avatars/988e860aaaf5496c5ec1d34f41e3abec?size=420"></p>

# Android Package Manager

Installing App from F-Droid with a native CLI

> Warning! This module depends on [Node.js][nodejs]. Install [Node.js][nodejs] module before using it. You can do this via [FoxMMM][foxmmm].

## Install

Install Node.js Magisk module first

```shell
yarn global add androidpackagemanager
```

## Usage

```shell
# Install latest package
apm install com.termux
# Install with specified version (code)
apm install com.termux#118
```

## Removing

```shell
apm remove com.fox2code.mmm.fdroid
apm uninstall com.termux
```
