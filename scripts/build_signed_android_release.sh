#!/bin/sh -e
#
# Build a release version and sign with debug key

react-native bundle --platform android --dev false --entry-file index.android.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# above step is supposed to produce some unneeded assets - https://github.com/facebook/react-native/issues/19239#issuecomment-414564404
rm -r android/app/src/main/res/drawable-*
cd android && ./gradlew assembleRelease && cd ..
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/release/app-release-unsigned.apk androiddebugkey

echo
echo "Now you can upload the apk to the device with the following command:"
echo
echo " adb -d push android/app/build/outputs/apk/release/app-release-unsigned.apk /storage/self/primary/Download"
