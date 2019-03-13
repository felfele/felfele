# Postmodern
[![Gitter](https://badges.gitter.im/felfele/purple-lounge.svg)](https://gitter.im/felfele/purple-lounge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Build Status](https://travis-ci.org/felfele/felfele.svg?branch=master)](https://travis-ci.org/felfele/felfele)

## Install dependencies

`npm install; react-native link`

## Build and test in simulator

`react-native run-ios `

## Start tests that run automatically

`npm run watchTest`

## Start packager in terminal

`react-native start --verbose --resetCache`

## Generate the icon

`app-icon generate`

Make sure the generated images does not contain transparency for iOS.

```bash
$ mogrify -alpha off ios/postmodern/Images.xcassets/AppIcon.appiconset/*.png
```

## Build android release version

`cd android`
`./gradlew assembleRelease`

## Sign the android release with debug key

### Generate a debug key
`$ keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "C=US, O=Android, CN=Android Debug"`

### Sign the build with the debug key

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/release/app-release-unsigned.apk androiddebugkey`

## Running with the debugger

`REACT_DEBUGGER="node node_modules/react-native-debugger-open/bin/rndebugger-open.js --open --port 8081" react-native start --verbose --resetCache`
