#!/bin/sh -e

./scripts/build_android_unsigned_release.sh

[ "$FELFELE_KEYSTORE_STOREPASS" = "" ] && (echo 'No $FELFELE_KEYSTORE_STOREPASS set, exiting' && exit 1)
[ "$FELFELE_KEYSTORE_KEYPASS" = "" ] && (echo 'No $FELFELE_KEYSTORE_KEYPASS set, exiting' && exit 1)

android_release_dir='android/app/build/outputs/apk/release'
unsigned_apk_name='app-release-unsigned.apk'
signed_apk_name='app-release.apk'
debug_signed_apk_name='debug-release.apk'
target_apk_name='felfele.apk'

cp -f $android_release_dir/$unsigned_apk_name $android_release_dir/$debug_signed_apk_name
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android/debug.keystore -storepass android -keypass android $android_release_dir/$debug_signed_apk_name androiddebugkey

cp -f $android_release_dir/$unsigned_apk_name $android_release_dir/$signed_apk_name
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android/app/felfele.keystore -storepass $FELFELE_KEYSTORE_STOREPASS -keypass $FELFELE_KEYSTORE_KEYPASS $android_release_dir/$signed_apk_name upload

$ANDROID_HOME/build-tools/28.0.3/zipalign -f -v 4 $android_release_dir/$signed_apk_name $android_release_dir/$target_apk_name

echo
echo "You can upload this file to the Play Store:"
echo
echo " $android_release_dir/$target_apk_name"
echo
echo "You can upload this file to the website for direct download:"
echo
echo " $android_release_dir/$debug_signed_apk_name"
echo
echo "You can upload the apk to the device with the following command:"
echo
echo " adb -d push $android_release_dir/$debug_signed_apk_name /storage/self/primary/Download"
echo
