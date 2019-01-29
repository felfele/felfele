#!/bin/bash -ex

./scripts/bump_build_number.sh
version=$(./scripts/cli.sh version)
./scripts/git_tag_release.sh "$version"

echo "TODO: ./scripts/build_signed_android_release.sh"
