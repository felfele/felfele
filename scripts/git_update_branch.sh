#!/bin/bash -ex

branch="release"

[ "$1" = "" ] && (echo 'No release_branch set, exiting' && exit 1)
[ "$2" != "" ] && branch="$2"

release_branch=$1

git checkout "$branch"
git merge "$release_branch"
git push origin "$branch"
git co "$release_branch"
