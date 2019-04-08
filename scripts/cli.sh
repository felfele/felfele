#!/bin/bash -ex

source="src/cli.ts"
target="build/dist/src/cli/cli.js"

npm run --silent tsc
node "$target" $*
