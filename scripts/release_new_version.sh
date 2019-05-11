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

ask "Write an update to CHANGELOG.md with the changes since last release"

echo "Running checks locally..."
npm run check

echo "Increasing the version number..."
./scripts/increase_version_number.sh

echo "Determining the version number..."
version="$(./scripts/cli.sh version)"
echo "Version: $version"

echo "Commit and push changes to the repo"
commit_message="Bumped version to $version"
ask "TODO: git commit -am \"$commit_message\" && git push"

ask "Check if the CI is green"

echo "Build the iOS version with XCode for archive..."
./scripts/build_xcode_archive.sh

ask "Upload the build to the App Store"

ask "In AppstoreConnect provide the crypto information to enable the new build"

echo "Building the android release version signed with debug key..."
./scripts/build_android_signed_release.sh

echo "Uploading the android version to https://app.felfele.com..."
./scripts/upload_android_release.sh "$version"

ask "Upload the build to the Play Store"

ask "Download the released versions and do manual QA (both android and iOS)"

echo "Tagging the git release with v$version..."
ask "TODO: ./scripts/git_tag_release.sh $version"

echo "Updating the git release branch with to the master..."
ask "TODO: ./scripts/git_update_release_branch.sh"

ask "Announce the release on Slack in the #releases channel"
echo "Release of version $version was successful!"
