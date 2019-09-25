#!/bin/bash -ex

i=$1
shift
message="$*"

./scripts/cli.sh protocol privateSharing post "testdata/contactIdentity$i.json" testdata/testIdentity.json "$message"

