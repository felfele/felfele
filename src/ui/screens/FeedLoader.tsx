import * as React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
} from 'react-native';
import { ComponentColors, Colors } from '../../styles';
import { NavigationHeader } from '../../components/NavigationHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TypedNavigation } from '../../helpers/navigation';
import { FragmentSafeAreaViewWithoutTabBar } from '../../ui/misc/FragmentSafeAreaView';

export interface DispatchProps {
    onLoad: () => void;
}

export interface StateProps {
    title: string | undefined;
    navigation: TypedNavigation;
}

type Props = DispatchProps & StateProps;

export class FeedLoader extends React.Component<Props> {
    public async componentDidMount() {
        this.props.onLoad();
    }

    public render() {
        const icon = (name: string, size: number = 20) =>
            <Icon name={name} size={size} color={ComponentColors.NAVIGATION_BUTTON_COLOR}/>;
        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader
                    title={this.props.title || 'Add channel'}
                    leftButton={{
                        label: icon('close', 24),
                        onPress: () => this.props.navigation.goBack(null),
                    }}
                    navigation={this.props.navigation}
                />
                <View style={styles.container}>
                        <View style={styles.centerIcon}>
                            <Text style={styles.activityText}>{}</Text>
                            <ActivityIndicator size='large' color='grey'/>
                        </View>
                </View>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        flex: 1,
        flexDirection: 'column',
    },
    centerIcon: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 100,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
        paddingTop: 50,
    },
    activityText: {
        fontSize: 14,
        color: Colors.GRAY,
        alignSelf: 'center',
        marginBottom: 10,
    },
});
