#!/bin/bash -ex

npm run check

./scripts/bump_build_number.sh
./scripts/git_tag_release.sh "$(./scripts/cli.sh version)"

echo "TODO: ./scripts/git_update_release_branch.sh"
echo "TODO: ./scripts/build_signed_android_release.sh"
