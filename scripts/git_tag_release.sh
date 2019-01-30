#!/bin/bash -e

version="$1"

git_commit_id=$(git rev-parse HEAD)

git tag -a v"$version" "$git_commit_id" -m "Tagged $version"
echo "TODO: git push --tags origin master"
