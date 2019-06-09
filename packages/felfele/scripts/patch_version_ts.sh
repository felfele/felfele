#!/bin/bash -e

[ "$npm_package_version" = "" ] && (echo 'No $npm_package_version set, exiting' && exit 1)

version=$npm_package_version
version_file="src/Version.ts"
backup_extension=".bak"
sed -i$backup_extension "s/const Version = .*;/const Version = '$version';/" "$version_file"
rm "$version_file$backup_extension" || true
