#!/bin/bash

# This script is required after a `yarn clean` to migrate all of our dependecy packages
# to androidx required by Android on June 17th (https://developers.google.com/android/guides/releases#june_17_2019).
#
# We should keep running this until all our dependencies are properly updated to an androidx supported version.

# Step #1:
# Use Jestify to migrate all old library packages to new ones defined on https://developer.android.com/jetpack/androidx/migrate#artifact_mappings from [node_modules].
npx jetify
