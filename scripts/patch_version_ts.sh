#!/bin/bash -e

declare npm_package_version
[ "$npm_package_version" = "" ] && (echo 'No npm_package_version set, exiting' && exit 1)

version=$npm_package_version
build_number=$(./scripts/get_build_number.sh)
version_file="src/Version.ts"
echo "export const Version = '$version';" > $version_file
echo "export const BuildNumber = '$build_number';" >> $version_file
