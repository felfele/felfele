#!/bin/bash -x

./scripts/bump_build_number.sh
version=$(./scripts/cli.sh version)
./scripts/git_tag_release.sh "$version"
