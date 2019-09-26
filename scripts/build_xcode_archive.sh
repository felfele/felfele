#!/bin/bash -e

TARGET=archive
if [ "$1" != "" ]; then
    TARGET="$*"
fi

cd ios
# shellcheck disable=SC2086
xcodebuild -allowProvisioningUpdates -quiet -scheme Felfele $TARGET
cd ..
