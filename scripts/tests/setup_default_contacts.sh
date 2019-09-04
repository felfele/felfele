#!/bin/bash -e

cli="./scripts/cli.sh --no-recompile"

for i in $(seq 1 4)
do
    echo "Creating contact $i..."
    $cli swarm feed -i testdata/contactIdentity$i.json create Contact$i
    $cli swarm feed -i testdata/contactIdentity$i.json sharePublicKey
    $cli protocol privateSharing post testdata/contactIdentity$i.json testdata/testIdentity.json "Hello from Contact$i"
done
