import * as React from 'react';
import { SafeAreaView, ViewProps } from 'react-native';
import { ComponentColors } from '../../styles';
import { StatusBarView } from '../../components/StatusBarView';

interface OwnProps {
    children: React.ReactNode | React.ReactNode[];
    topBackgroundColor?: string;
    bottomBackgroundColor?: string;
}

type Props = ViewProps & OwnProps;

export const FragmentSafeAreaViewWithoutTabBar = (props: Props) => (
    <React.Fragment>
        <StatusBarView
            backgroundColor={props.topBackgroundColor || ComponentColors.HEADER_COLOR}
            hidden={false}
            translucent={false}
            barStyle='light-content'
            networkActivityIndicatorVisible={true}
        />
        <SafeAreaView style={{ flex: 0, backgroundColor: ComponentColors.HEADER_COLOR }} />
        {props.children}
    </React.Fragment>
);

export const FragmentSafeAreaViewForTabBar = (props: Props) => (
    <React.Fragment>
        <StatusBarView
                backgroundColor={props.topBackgroundColor || ComponentColors.HEADER_COLOR}
                hidden={false}
                translucent={false}
                barStyle='light-content'
                networkActivityIndicatorVisible={true}
            />
        <SafeAreaView style={{ flex: 0, backgroundColor: ComponentColors.HEADER_COLOR }}/>
        <SafeAreaView style={{ flex: 1, backgroundColor: props.bottomBackgroundColor || 'transparent' }}>
            {props.children}
        </SafeAreaView>
    </React.Fragment>
);
