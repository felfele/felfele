
## Install dependencies

`npm install; react-native link`

## Build and test in simulator

`react-native run-ios `

## Start tests that run automatically

`npm test`

## Start packager in terminal

`react-native start --verbose --resetCache`

## Generate the icon

`app-icon generate`

## Sign the android release with debug key

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/app-release-unsigned.apk androiddebugkey`
