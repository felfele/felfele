#!/bin/bash -e

SCHEME=Felfele
TARGET=archive
if [ "$1" != "" ]; then
    SCHEME="$1"
    shift
    TARGET="$*"
fi

# shellcheck disable=SC2086
(cd ios && xcodebuild -allowProvisioningUpdates -quiet -scheme $SCHEME $TARGET)
