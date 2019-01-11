import { StyleSheet, Platform } from 'react-native';

export const IconSize = {
    LARGE_LIST_ICON: 32,
    MEDIUM_LIST_ICON: 24,
    SMALL_LIST_ICON: 10,
};

export const Colors = {
    BRAND_RED: '#FF4C65',
    BRAND_YELLOW: '#FFC33C',
    BRAND_BLUE: '#00C8F8',
    BRAND_GREEN: '#6DD002',
    BRAND_TEAL: '#59C4C5',
    BRAND_LIGHT_YELLOW: '#FBE2B4',
    BRAND_LIGHT_GREY: '#BDBBBB',
    BRAND_MEDIUM_GREY: '#666464',
    BRAND_VIOLET: '#5C1997',
    BRAND_ACTION_BLUE: '#157EFB',
    WHITE: '#FFFF',
    LIGHTISH_GRAY: '#9B9B9B',
    LIGHT_GRAY: '#D3D3D3',
    LIGHTER_GRAY: '#E6E6E6',
    VERY_LIGHT_GRAY: '#F8F8F8',
    GRAY: '#808080',
    DARK_GRAY: '#303030',
    DEFAULT_ACTION_COLOR: '#007AFF',
    STRONG_TEXT: '#303030',
    ATTENTION: '#D0021B',
    IOS_LIGHT_BLUE: '#54C7FC',
    IOS_YELLOW: '#FFCD00',
    IOS_ORANGE: '#FF9600',
    IOS_PINK: '#FF2851',
    IOS_DARK_BLUE: '#0076FF',
    IOS_GREEN: '#44DB5E',
    IOS_RED: '#FF3824',
    IOS_GRAY: '#8E8E93',
    BACKGROUND_COLOR: '#EFEFF4',
};

export const DefaultFont = 'Helvetica Neue';

export const DefaultStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    favicon: {
        borderRadius : 3,
        width: IconSize.LARGE_LIST_ICON,
        height: IconSize.LARGE_LIST_ICON,
        marginHorizontal: 4,
        marginVertical: 3,
    },
});

export const DefaultNavigationBarHeight = 44;
export const DefaultTabBarHeight = 50;

export const BACK_ICON_NAME = Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back';
export const BUTTON_COLOR = Platform.OS === 'ios' ? Colors.DEFAULT_ACTION_COLOR : Colors.DARK_GRAY;
