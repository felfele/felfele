#!/bin/sh -ex
#
# Build a release version and sign with debug key

react-native bundle --platform android --dev false --entry-file index.android.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

cd android && ./gradlew assembleRelease && cd ..
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/release/app-release-unsigned.apk androiddebugkey

# After this you can upload the apk to the device with:
#  adb push app/build/outputs/apk/release/app-release-unsigned.apk /storage/self/primary/Download
