#!/bin/sh -e

plist="ios/Felfele/Info.plist"
if [ ! -f "$plist" ]; then
    echo "Cannot find $plist file!"
    echo "Run this script from the project root!"
    exit 1
fi
dir="$(dirname "$plist")"

original_buildnum=$(/usr/libexec/Plistbuddy -c "Print CFBundleVersion" "$plist")
if [ -z "$original_buildnum" ]; then
    echo "No build number in $plist"
    exit 2
fi
buildnum=$(expr $original_buildnum + 1)
/usr/libexec/Plistbuddy -c "Set CFBundleVersion $buildnum" "$plist"
echo "Incremented build number to $buildnum"

version_file="src/Version.ts"
backup_extension=".bak"
sed -i$backup_extension "s/const BuildNumber = .*;/const BuildNumber = $buildnum;/" "$version_file"
rm "$version_file$backup_extension" || true
