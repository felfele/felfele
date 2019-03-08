#!/bin/bash -e

TARGET=archive
if [ "$1" != "" ]; then
    TARGET="$1"
fi

cd ios
xcodebuild -allowProvisioningUpdates -quiet -scheme postmodern $TARGET
cd ..
