#!/bin/bash -ex

npm run check

./scripts/bump_build_number.sh
version=$(./scripts/cli.sh version)
./scripts/git_tag_release.sh "$version"
./scripts/git_update_release_branch.sh

echo "TODO: ./scripts/build_signed_android_release.sh"
