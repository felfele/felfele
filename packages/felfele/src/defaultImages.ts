import { BundledImage } from '@felfele/felfele-core';

declare var require: (id: string) => BundledImage;

export const defaultImages = {
    balloon: require('../images/balloon.svg'),
    bug: require('../images/bug.svg'),
    compass: require('../images/compass.svg'),
    ghost: require('../images/ghost.svg'),
    iconWhiteTransparent: require('../images/icon-white-transparent.png'),
    link: require('../images/link.svg'),
    snorkeling: require('../images/snorkeling.svg'),
    defaultUser: require('../images/assets/defaultuser.png'),
    felfeleAssistant: require('../images/felfele-assistant.png'),
};
