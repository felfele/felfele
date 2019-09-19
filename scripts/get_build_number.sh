#!/bin/bash -e

cat android/app/build.gradle | grep 'versionCode [[:digit:]]\+' | awk '{ print $2 }'

