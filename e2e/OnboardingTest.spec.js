describe('Onboarding workflow', () => {
    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should have welcome screen', async () => {
        await expect(element(by.id('Welcome'))).toBeVisible();
    });
})
