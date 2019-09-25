#!/bin/bash -ex

[ "$1" = "" ] && (echo 'No release_branch set, exiting' && exit 1)

release_branch=$1

git checkout release
git merge "$release_branch"
git push origin release
git co "$release_branch"
