#!/bin/bash -e

grep 'versionCode [[:digit:]]\+' android/app/build.gradle | awk '{ print $2 }'

