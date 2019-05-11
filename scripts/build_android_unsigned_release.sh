#!/bin/sh -e

(cd android && ./gradlew --quiet --console plain assembleRelease)

