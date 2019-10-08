#!/bin/bash -e

function ask {
    while true; do
        echo
        read -r -p "$1, press y when done: " -n1 input
        echo
        if [ "$input" = "y" ]; then
            return
        fi
    done
}

function output {
    color="\033[0;92m"
    reset_color="\033[0m"
    echo -e "$color-> $1$reset_color"
}

output "Running checks locally..."
(git_output=$(git status --untracked-files=no --porcelain) && [ -z "$git_output" ]) || (echo "Has uncommitted changes, exiting..." && exit 1)
npm run check

output "Increasing the build number..."
./scripts/increase_build_number.sh

output "Determining the version number..."
version="$(./scripts/cli.sh version)"
output "Version: $version"

output "Determining the build number..."
build="$(./scripts/cli.sh buildNumber)"
output "Build number: $build"

release_branch="beta-$version-$build"
git checkout -b "$release_branch"
output "Commit and push changes to the repo"
commit_message="Bumped build number to $build"
git commit -am "$commit_message"

output "Build the iOS version with XCode for archive..."
./scripts/build_xcode_archive.sh FelfeleBeta archive

ask "Upload the build to the App Store"

ask "In AppstoreConnect provide the crypto information to enable the new build"

output "Updating the git release branch with to the master..."
./scripts/git_update_branch.sh "$release_branch" "beta"

ask "Merge the release branch to master on Github"
