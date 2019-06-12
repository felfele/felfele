Felfele [![Gitter](https://badges.gitter.im/felfele/purple-lounge.svg)](https://gitter.im/felfele/purple-lounge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Build Status](https://travis-ci.org/felfele/felfele.svg?branch=master)](https://travis-ci.org/felfele/felfele)
=======

## Installation and setup

We are using Lerna to manage packages. One of the projects (packages/felfele) uses React Native. You will need Android SDK, XCode, Node.js and NPM to be installed.

## Install dependencies

`npm run bootstrap`

## Build all packages

`npm run build`

## Development

If you are doing development in one of the modules which depend on another one, you should also run  
`npm run build:watch`

For more details developing the mobile app, check out the [readme](packages/felfele/README.md)
