import { StyleSheet } from 'react-native';

export const IconSize = {
    LARGE_LIST_ICON: 40,
    MEDIUM_LIST_ICON: 24,
    SMALL_LIST_ICON: 10,
};

export const Colors = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    LIGHTISH_GRAY: '#9B9B9B',
    PINKISH_GRAY: '#BBBBBB',
    BROWNISH_GRAY: '#696969',
    LIGHT_GRAY: '#DDDDDD',
    LIGHTER_GRAY: '#EEEEEE',
    VERY_LIGHT_GRAY: '#F8F8F8',
    MEDIUM_GRAY: '#A4A4A4',

    GRAY: '#808080',
    DARK_GRAY: '#4A4A4A',
    DARK_RED: '#D2001E',
    BRAND_PURPLE: '#6200EA',
    BRAND_PURPLE_LIGHT: '#BA76FA',
    BRAND_PURPLE_DARK: '#3700B4',
};
export const ComponentColors = {
    STRONG_TEXT: '#303030',
    TEXT_COLOR: Colors.GRAY,
    LABEL_COLOR: Colors.LIGHTISH_GRAY,
    HINT_TEXT_COLOR: Colors.BROWNISH_GRAY,
    BACKGROUND_COLOR: Colors.VERY_LIGHT_GRAY,
    DISABLED_BUTTON_COLOR: Colors.LIGHT_GRAY,
    BUTTON_COLOR: Colors.BRAND_PURPLE,
    PRIMARY_RECTANGULAR_BUTTON_COLOR: Colors.WHITE,
    SECONDARY_RECTANGULAR_BUTTON_COLOR: Colors.LIGHTER_GRAY,
    NAVIGATION_BUTTON_COLOR: Colors.BLACK,
    HEADER_COLOR: Colors.VERY_LIGHT_GRAY,
    TAB_ACTIVE_COLOR: Colors.BLACK,
    TAB_INACTIVE_COLOR: Colors.PINKISH_GRAY,
    TAB_ACTION_BUTTON_COLOR: Colors.BRAND_PURPLE,
    TAB_ACTION_BUTTON_ICON_COLOR: Colors.WHITE,
};

export const defaultBoldFont = 'NunitoSans-Bold';
export const defaultRegularFont = 'NunitoSans-Regular';
export const defaultMediumFont = 'NunitoSans-SemiBold';
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
export const DefaultTabBarHeight = 66;

export const BACK_ICON_NAME = 'md-arrow-back';
