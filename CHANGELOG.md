## v1.0.4 (2019-06-11) Alpha update

This release adds the following new features and fixes:

- Feature: Improved post editor, image reordering added (https://github.com/felfele/felfele/pull/400)
- Bugfix: It was possible to follow yourself (https://github.com/felfele/felfele/pull/397)
- Bugfix: reshared posts now has correct timestamp (https://github.com/felfele/felfele/pull/399)
- Some crashes and permission issues fixed

## v1.0.3 (2019-05-23) First Alpha update

This release adds the following new features and fixes:

- Feature: You can take a picture during profile creation (https://github.com/felfele/felfele/pull/360)
- Feature: More descriptive link sharing, which opens in the app (https://github.com/felfele/felfele/pull/379)
- Feature: Sharing links in posts preview the content  (https://github.com/felfele/felfele/pull/331)
- Many small bugfixes and style changes

## v1.0.2 (2019-05-13) Alpha release

This release adds the following new features and fixes:

- Feature: Improved onboarding (https://github.com/felfele/felfele/pull/322)
- Feature: Better news recommendation (https://github.com/felfele/felfele/pull/334)
- Feature: Automatically fetch feeds on app start (https://github.com/felfele/felfele/pull/331)
- Feature: Updated icons and action button placement (https://github.com/felfele/felfele/pull/341)
- Many small bugfixes and style changes

## v0.9.33 (2019-04-12)

This release adds the following new features and fixes:

- Feature: New header and tab bar style (https://github.com/felfele/felfele/pull/299)
- Feature: New design for post actions (https://github.com/felfele/felfele/pull/301)
- Feature: We added notifications when there is a new post in the Felfele Foundation feed (https://github.com/felfele/felfele/pull/290)
- Bugfix: Sharing on android was broken sometimes (https://github.com/felfele/felfele/pull/275)
- Bugfix: Sometime a post was accidentally posted mulitple times (https://github.com/felfele/felfele/pull/271)
- Bugfix: The default avatar was shown too often instead of the feed avatar (https://github.com/felfele/felfele/pull/300)

## v0.9.32 (2019-03-27)

This release adds the following new features and fixes:

- Feature: News recommendation: you can find interesting new content organized by categories (https://github.com/felfele/felfele/pull/230)
- Feature: Automatic sharing: your posts are shared automatically now, you can disable this (https://github.com/felfele/felfele/pull/242)
- Bugfix: Fixed stuck syncing after sharing (https://github.com/felfele/felfele/pull/244)
- Many small bugfixes and style changes

## v0.9.31 (2019-03-01)

This release adds the following new features and fixes:

- [FEATURE] Splash Screen! You may have to delete the app and reinstall to see it :) (https://github.com/felfele/felfele/pull/187)
- [FEATURE] We redesigned the app according to the latest design (https://github.com/felfele/felfele/pull/170)
- [FEATURE] Multiple photos are shown in an autoplaying carousel (https://github.com/felfele/felfele/pull/179)
- [FEATURE] Posts from others can be shared on your feed (https://github.com/felfele/felfele/pull/171)
- [FEATURE] We automatically create a feed for you when you first start the app (https://github.com/felfele/felfele/pull/200)
- [FEATURE] Bug reporting (https://github.com/felfele/felfele/pull/155)
- [FEATURE] Posts are stored separately and in a timeline as well online (https://github.com/felfele/felfele/pull/151)
- [FEATURE] Add feed from clipboard automatically (https://github.com/felfele/felfele/pull/149)
- [BUGFIX] Hashmarks in the text of post no longer change the size of the text (https://github.com/felfele/felfele/pull/154)

## v0.9.28 (2019-01-30)

This release adds the following new features and fixes:

- [FEATURE] Find individual feeds from the News feed with a hamburger menu
(https://github.com/felfele/felfele/pull/143)
- [FEATURE] Feed preview when you are adding feed(https://github.com/felfele/felfele/pull/127)
- [BUGFIX] Fixed feed list editor footer (https://github.com/felfele/felfele/commit/ed842210843d20526ff109e6f307a3ab57f20ceb)
- [BUGFIX] Card times were fixed (https://github.com/felfele/felfele/pull/136)
- [INTERNAL] We changed how we display the feeds, they are unified now (https://github.com/felfele/felfele/pull/126)
- [INTERNAL] Removed immutable-js (https://github.com/felfele/felfele/pull/132)
- [INTERNAL] Added more documentation and contribution guidelines (https://github.com/felfele/felfele/pull/140) (https://github.com/felfele/felfele/pull/138)
- [INTERNAL] Added CLI tool for scripting and release process improvements (https://github.com/felfele/felfele/pull/142)


## v0.9.26 (2019-01-11)

This release adds the following new features and fixes:

- [FEATURE] Individual feeds can be opened by tapping the name of the author.(https://github.com/felfele/felfele/pull/81)
- [FEATURE] Feeds can be added as favorites. You can open the feed and then tap the heart icon. There is also a new tab for the favorites. (https://github.com/felfele/felfele/pull/90)
- [FEATURE] Individual feeds or the favorites can be updated without downloading all the feeds. (https://github.com/felfele/felfele/pull/112)
- [FEATURE] Added unfollow button. You can open the feed and tap the chain icon. (https://github.com/felfele/felfele/pull/85)
- [FEATURE] Unified navigation headers everywhere, improved android styling. (https://github.com/felfele/felfele/pull/98)
- [FEATURE] Updated application icon
(https://github.com/felfele/felfele/commit/90110ee0ae86095fc40beb99d4598bdda74dac03)
- [FEATURE] There is a new, experimental Backup & recovery mechanism. Currently it's hidden under the debug menu. (https://github.com/felfele/felfele/pull/111)
- [FEATURE] There is now versioning in the underlying stored data, so that in the future updates with potentially breaking changes to the data model are possible. (https://github.com/felfele/felfele/pull/108)
- [BUGFIX] Onboarding posts disappear when you add a new post (https://github.com/felfele/felfele/pull/80)
- [BUGFIX] You can safely post hashtags and it won't change the size of the text anymore (https://github.com/felfele/felfele/issues/73)
- [BUGFIX] Sharing the identity from android works now (https://github.com/felfele/felfele/issues/69)
- [BUGFIX] Unfollowed feeds are shown with lighter gray at the end of the feed list. (https://github.com/felfele/felfele/commit/039c388a6e2c99d05fec9a8b86dfd13410fb99c5)
