import * as React from 'react';
import { SafeAreaView, ViewProps } from 'react-native';
import { ComponentColors } from '../../styles';
import { StatusBarView } from '../../components/StatusBarView';

export const FragmentSafeAreaViewWithoutTabBar = (props: ViewProps & { children: any }) => (
    <React.Fragment>
        <StatusBarView
            backgroundColor={ComponentColors.HEADER_COLOR}
            hidden={false}
            translucent={false}
            barStyle='light-content'
            networkActivityIndicatorVisible={true}
        />
        <SafeAreaView style={{ flex: 0, backgroundColor: ComponentColors.HEADER_COLOR }} />
        {props.children}
    </React.Fragment>
);

export const FragmentSafeAreaViewForTabBar = (props: ViewProps & { children: any }) => (
    <React.Fragment>
        <SafeAreaView style={{ flex: 0, backgroundColor: ComponentColors.HEADER_COLOR }}/>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <StatusBarView
                backgroundColor={ComponentColors.HEADER_COLOR}
                hidden={false}
                translucent={false}
                barStyle='light-content'
                networkActivityIndicatorVisible={true}
            />
            {props.children}
        </SafeAreaView>
    </React.Fragment>
);
