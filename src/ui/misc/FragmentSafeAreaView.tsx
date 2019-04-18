import * as React from 'react';
import { SafeAreaView, ViewProps } from 'react-native';
import { ComponentColors } from '../../styles';
import { StatusBarView } from '../../components/StatusBarView';
import { TabBarPlaceholder } from './TabBarPlaceholder';

export const FragmentSafeAreaView = (props: ViewProps & { children: any }) => (
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
        <TabBarPlaceholder/>
    </React.Fragment>
);
