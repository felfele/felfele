Before creating a release, make sure you

- [ ] Wrote an update to CHANGELOG.md with the changes since last release
- [ ] Bumped the build number with the script
- [ ] Commit and push changes to the repo
- [ ] Created and pushed a tag with the new version number
- [ ] Make sure the CI is green
- [ ] Update the git release branch with to the master
- [ ] Build the android release with the script
- [ ] Upload the android version to https://app.felfele.com
- [ ] Build the iOS version with XCode for archive
- [ ] Upload the build to the App Store
- [ ] In AppstoreConnect provide the crypto information to enable the new build
- [ ] Announce the release on Slack in the #releases channel
