#!/bin/bash -e

TARGET=archive
if [ "$1" != "" ]; then
    TARGET="$*"
fi

cd ios
xcodebuild -allowProvisioningUpdates -quiet -scheme Felfele $TARGET
cd ..
