#!/bin/bash -e

function ask {
    while true; do
        echo
        read -p "$1, press y when done: " -n1 input
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

ask "Write an update to CHANGELOG.md with the changes since last release"

output "Increasing the version number..."
./scripts/increase_version_number.sh

output "Determining the version number..."
version="$(./scripts/cli.sh version)"
output "Version: $version"

release_branch="release-$version"
git checkout -b $release_branch
output "Commit and push changes to the repo"
commit_message="Bumped version to $version"
git commit -am "$commit_message" && git push origin "$release_branch"

ask "Make a PR with release branch, check if the CI is green"

output "Build the iOS version with XCode for archive..."
./scripts/build_xcode_archive.sh

ask "Upload the build to the App Store"

ask "In AppstoreConnect provide the crypto information to enable the new build"

output "Building the android release version signed with debug key..."
./scripts/build_android_signed_release.sh

output "Uploading the android version to https://app.felfele.com..."
./scripts/upload_android_release.sh "$version"

ask "Upload the build to the Play Store"

ask "Download the released versions and do manual QA (both android and iOS)"

output "Tagging the git release with v$version..."
./scripts/git_tag_release.sh "$version"

output "Updating the git release branch with to the master..."
./scripts/git_update_release_branch.sh "$release_branch"

ask "Merge the release branch to master on Github"

ask "Announce the release on Slack in the #releases channel"
output "Release of version $version was successful!"
