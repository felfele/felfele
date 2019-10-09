#!/bin/bash -e

tag_name="$1"

git_commit_id=$(git rev-parse HEAD)

git tag -a "$tag_name" "$git_commit_id" -m "Tagged $tag_name"
git push origin "$tag_name"

