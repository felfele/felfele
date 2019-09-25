#!/bin/bash -e

version="$1"

git_commit_id=$(git rev-parse HEAD)
tag_name="v$version"

git tag -a "$tag_name" "$git_commit_id" -m "Tagged $version"
git push origin "$tag_name"

