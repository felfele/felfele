#!/bin/bash -ex

git co release
git merge master
git push origin release
git co master
