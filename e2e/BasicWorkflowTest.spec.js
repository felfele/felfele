describe('Basic workflow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should open the editor and create a post', async () => {
    await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
    await element(by.id('FeedHeader/TouchableHeaderText')).tap();
    await expect(element(by.id('PostEditor/TextInput'))).toBeVisible();
    await element(by.id('PostEditor/TextInput')).typeText('first post');
    await element(by.id('NavigationHeader/RightButton')).tap();
    await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
    await expect(element(by.id('YourFeed/Post1'))).toBeVisible();
  });
})
