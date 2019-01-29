#!/bin/bash -e

source="src/cli.ts"
target="build/dist/src/cli.js"

npm run --silent tsc
node "$target" $*
