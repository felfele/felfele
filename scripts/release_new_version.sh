#!/bin/bash -e

function ask {
    echo
    read -p "$1, press y when done: " -n1 input
    echo
    if [ "$input" != "y" ]; then
        exit 1
    fi
}

echo "Running checks locally..."
npm run check

echo "Bumping the build number..."
./scripts/bump_build_number.sh
version="$(./scripts/cli.sh version)"

echo "Commit and push changes to the repo"
commit_message="Bumped version to $version"
ask "TODO: git commit -am \"$commit_message\" && git push"

ask "Check if the CI is green"

ask "Build the iOS version with XCode for archive"

ask "Upload the build to the App Store"

ask "In AppstoreConnect provide the crypto information to enable the new build"

echo "Building the android release version signed with debug key..."
ask "TODO: ./scripts/build_signed_android_release.sh"

ask "Upload the android version to https://app.felfele.com"

echo "Tagging the git release with v$version"
ask "TODO: ./scripts/git_tag_release.sh $version"

echo "Updating the git release branch with to the master..."
ask "TODO: ./scripts/git_update_release_branch.sh"

ask "Announce the release on Slack in the #releases channel"
echo "Release of version $version was successful!"
