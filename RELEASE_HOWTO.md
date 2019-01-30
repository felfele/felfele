Before creating a release, make sure you

- [ ] Write an update to CHANGELOG.md with the changes since last release
- [ ] Bump the build number with the script (`./scripts/bump_build_number.sh`)
- [ ] Commit and push changes to the repo
- [ ] Check if the CI is green
- [ ] Build the iOS version with XCode for archive
- [ ] Upload the build to the App Store
- [ ] In AppstoreConnect provide the crypto information to enable the new build
- [ ] Build the android release with the script (`./scripts/build_signed_android_release.sh`)
- [ ] Upload the android version to https://app.felfele.com
- [ ] Create and push a tag with the new version number (`./scripts/git_tag_release.sh`)
- [ ] Update the git release branch with to the master (`./scripts/git_update_release_branch`)
- [ ] Announce the release on Slack in the #releases channel
