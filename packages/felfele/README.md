Felfele [![Gitter](https://badges.gitter.im/felfele/purple-lounge.svg)](https://gitter.im/felfele/purple-lounge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Build Status](https://travis-ci.org/felfele/felfele.svg?branch=master)](https://travis-ci.org/felfele/felfele)
=======

## Installation and setup

This project uses React Native. You will need Android SDK, XCode, Node.js and NPM to be installed.

## Install dependencies
If you have set up the project from the root using `npm run bootstrap`, you can skip this step.  
`npm install && npm run link`

## Link assets

`npm run link-assets`

## Build and test in simulator

`npm run ios `

## Start tests that run automatically

`npm run watchTest`

## Start packager in terminal

`npm start -- --reset-cache`

## Generate the icon

`app-icon generate`

Make sure the generated images does not contain transparency for iOS.

```bash
$ mogrify -alpha off ios/felfele/Images.xcassets/AppIcon.appiconset/*.png
```

## Build android release version

`cd android`
`./gradlew assembleRelease`

## Sign the android release with debug key

### Generate a debug key
`$ keytool -genkey -v -keystore android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "C=US, O=Android, CN=Android Debug"`

### Sign the build with the debug key

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/release/app-release-unsigned.apk androiddebugkey`

## Running with the debugger

Set the environment variable `REACT_DEBUGGER`, e.g.:

`REACT_DEBUGGER="node node_modules/react-native-debugger-open/bin/rndebugger-open.js --open --port 8081"`

Then start the packager as normal.

## Running E2E tests

It is iOS only for now.

`npm run e2e:ios`
