#!/bin/bash -ex

version="$1"
apk_source="android/app/build/outputs/apk/release/debug-release.apk"
server_name="app.felfele.com"
server_dir="/var/www/$server_name"
apk_versioned_target="felfele-$version.apk"
apk_target="felfele.apk"
deployment_user="deployment"

scp "$apk_source" "$deployment_user@$server_name:$server_dir/$apk_versioned_target"
ssh "$deployment_user@$server_name" "rm $server_dir/$apk_target"
ssh "$deployment_user@$server_name" "ln -s $server_dir/$apk_versioned_target $server_dir/$apk_target"
