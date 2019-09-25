#!/bin/bash -ex

i=$1
shift

./scripts/cli.sh protocol privateSharing list "testdata/contactIdentity$i.json" testdata/testIdentity.json

