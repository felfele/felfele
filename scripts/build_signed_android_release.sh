#!/bin/sh -ex
#
# Build a release version and sign with debug key

cd android && ./gradlew assembleRelease && cd ..
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/app-release-unsigned.apk androiddebugkey
