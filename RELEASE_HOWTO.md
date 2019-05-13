### Release HOWTO

You can do the release with a script that will guide you through the process:
```
./scripts/release_new_version.sh
```

Or if you would like manually, make sure you

- [ ] Write an update to CHANGELOG.md with the changes since last release
- [ ] Run checks locally if the build is green (`npm run check`)
- [ ] Increase the version number with the script (`./scripts/increase_version_number.sh`)
- [ ] Commit and push changes to the repo
- [ ] Check if the CI is green
- [ ] Build the iOS version with XCode for archive (`./scripts/build_xcode_archive.sh`)
- [ ] Upload the build to the App Store
- [ ] In AppstoreConnect provide the crypto information to enable the new build
- [ ] Build the android release with the script (`./scripts/build_android_signed_release.sh`)
- [ ] Upload the android version to https://app.felfele.com (`./scripts/upload_android_release.sh "$(./scripts/cli.sh version)"`)
- [ ] Download the released versions and do manual QA (both android and iOS)
- [ ] Create and push a tag with the new version number (`./scripts/git_tag_release.sh "$(./scripts/cli.sh version)"`)
- [ ] Update the git release branch with to the master (`./scripts/git_update_release_branch`)
- [ ] Announce the release on Slack in the #releases channel
