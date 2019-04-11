describe('Post workflow', () => {
    before(async () => {
        await device.reloadReactNative();
        await expect(element(by.id('Welcome'))).toBeVisible();
        await element(by.id('Welcome')).longPress();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should open the editor and create a post', async () => {
        await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
        await element(by.id('FeedHeader/TouchableHeaderText')).tap();
        await expect(element(by.id('PostEditor/TextInput'))).toBeVisible();
        await element(by.id('PostEditor/TextInput')).typeText('first post');
        await element(by.id('PostEditor/SendPostButton')).tap();
        await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
        await expect(element(by.id('YourFeed/Post3'))).toBeVisible();
    });

    it('should close the editor without dialog when no text entered', async () => {
        await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
        await element(by.id('FeedHeader/TouchableHeaderText')).tap();
        await expect(element(by.id('PostEditor/TextInput'))).toBeVisible();
        await element(by.id('PostEditor/CloseButton')).tap();
        await expect(element(by.id('FeedHeader/TouchableHeaderText'))).toBeVisible();
    });

    it('should open the editor from tab bar too', async () => {
        await expect(element(by.id('TabBarPostButton'))).toBeVisible();
        await element(by.id('TabBarPostButton')).tap();
        await expect(element(by.id('PostEditor/TextInput'))).toBeVisible();
    });

})
