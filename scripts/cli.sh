#!/bin/bash -e

source="src/cli.ts"
target="build/dist/src/cli/cli.js"

if [ "$1" = "--no-recompile" ]; then
    shift
else
    npm run --silent tsc
fi
node "$target" "$@"
