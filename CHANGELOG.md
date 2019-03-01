## v0.9.29 (2019-03-01)

This release adds the following new features and fixes:

- [FEATURE] We redesigned the app according to the latest design (https://github.com/agazso/postmodern/pull/170)
- [FEATURE] Multiple photos are shown in an autoplaying carousel (https://github.com/agazso/postmodern/pull/179)
- [FEATURE] Posts from others can be shared on your feed (https://github.com/agazso/postmodern/pull/171)
- [FEATURE] Bug reporting (https://github.com/agazso/postmodern/pull/155)
- [FEATURE] Posts are stored separately and in a timeline as well online (https://github.com/agazso/postmodern/pull/151)
- [FEATURE] Add feed from clipboard automatically (https://github.com/agazso/postmodern/pull/149)
- [BUGFIX] Hashes in the text no longer change the size of the text (https://github.com/agazso/postmodern/pull/154)

## v0.9.28 (2019-01-30)

This release adds the following new features and fixes:

- [FEATURE] Find individual feeds from the News feed with a hamburger menu
(https://github.com/agazso/postmodern/pull/143)
- [FEATURE] Feed preview when you are adding feed(https://github.com/agazso/postmodern/pull/127)
- [BUGFIX] Fixed feed list editor footer (https://github.com/agazso/postmodern/commit/ed842210843d20526ff109e6f307a3ab57f20ceb)
- [BUGFIX] Card times were fixed (https://github.com/agazso/postmodern/pull/136)
- [INTERNAL] We changed how we display the feeds, they are unified now (https://github.com/agazso/postmodern/pull/126)
- [INTERNAL] Removed immutable-js (https://github.com/agazso/postmodern/pull/132)
- [INTERNAL] Added more documentation and contribution guidelines (https://github.com/agazso/postmodern/pull/140) (https://github.com/agazso/postmodern/pull/138)
- [INTERNAL] Added CLI tool for scripting and release process improvements (https://github.com/agazso/postmodern/pull/142)


## v0.9.26 (2019-01-11)

This release adds the following new features and fixes:

- [FEATURE] Individual feeds can be opened by tapping the name of the author.(https://github.com/agazso/postmodern/pull/81)
- [FEATURE] Feeds can be added as favorites. You can open the feed and then tap the heart icon. There is also a new tab for the favorites. (https://github.com/agazso/postmodern/pull/90)
- [FEATURE] Individual feeds or the favorites can be updated without downloading all the feeds. (https://github.com/agazso/postmodern/pull/112)
- [FEATURE] Added unfollow button. You can open the feed and tap the chain icon. (https://github.com/agazso/postmodern/pull/85)
- [FEATURE] Unified navigation headers everywhere, improved android styling. (https://github.com/agazso/postmodern/pull/98)
- [FEATURE] Updated application icon
(https://github.com/agazso/postmodern/commit/90110ee0ae86095fc40beb99d4598bdda74dac03)
- [FEATURE] There is a new, experimental Backup & recovery mechanism. Currently it's hidden under the debug menu. (https://github.com/agazso/postmodern/pull/111)
- [FEATURE] There is now versioning in the underlying stored data, so that in the future updates with potentially breaking changes to the data model are possible. (https://github.com/agazso/postmodern/pull/108)
- [BUGFIX] Onboarding posts disappear when you add a new post (https://github.com/agazso/postmodern/pull/80)
- [BUGFIX] You can safely post hashtags and it won't change the size of the text anymore (https://github.com/agazso/postmodern/issues/73)
- [BUGFIX] Sharing the identity from android works now (https://github.com/agazso/postmodern/issues/69)
- [BUGFIX] Unfollowed feeds are shown with lighter gray at the end of the feed list. (https://github.com/agazso/postmodern/commit/039c388a6e2c99d05fec9a8b86dfd13410fb99c5)
