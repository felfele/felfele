#!/bin/bash -ex

git stash
git co release
git merge master
git push origin release
git co master
git stash pop
