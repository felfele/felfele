#!/bin/bash -e

cd ios
xcodebuild -quiet -scheme postmodern archive
cd ..
