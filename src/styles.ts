import { StyleSheet, Platform } from 'react-native';

export const IconSize = {
    LARGE_LIST_ICON: 40,
    MEDIUM_LIST_ICON: 24,
    SMALL_LIST_ICON: 10,
};

const BaseColors = {
};

export const Colors = {
    WHITE: '#FFFF',
    LIGHTISH_GRAY: '#9B9B9B',
    LIGHT_GRAY: '#D3D3D3',
    LIGHTER_GRAY: '#E6E6E6',
    VERY_LIGHT_GRAY: '#F8F8F8',
    GRAY: '#808080',
    DARK_GRAY: '#4A4A4A',
    BRAND_PURPLE: '#873FFF',
    STRONG_TEXT: '#303030',
    BACKGROUND_COLOR: '#DDDDDD',
    BUTTON_COLOR: '#4A4A4A',
};

export const defaultBoldFont = 'Roboto-Bold';
export const defaultRegularFont = 'Roboto-Regular';
export const defaultMediumFont = 'Roboto-Medium';
export const defaultFont = defaultRegularFont;
export const defaultTextProps = {
    style: {
      fontFamily: defaultFont,
      fontSize: 15,
    },
};

export const DefaultStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    faviconLarge: {
        borderRadius : 20,
        width: IconSize.LARGE_LIST_ICON,
        height: IconSize.LARGE_LIST_ICON,
    },
    faviconMedium: {
        borderRadius : 12,
        width: IconSize.MEDIUM_LIST_ICON,
        height: IconSize.MEDIUM_LIST_ICON,
    },
});

export const DefaultNavigationBarHeight = 44;
export const DefaultTabBarHeight = 50;

export const BACK_ICON_NAME = 'md-arrow-back';
