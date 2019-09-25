#!/bin/bash -e

target="build/dist/src/cli/cli.js"

if [ "$1" = "--no-recompile" ]; then
    shift
else
    npm run --silent tsc
fi
node "$target" "$@"
