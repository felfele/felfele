import * as React from 'react';
import {
    Image,
    StyleSheet,
    View,
    Linking,
} from 'react-native';

import { ImageData } from '../../../models/ImageData';
import SplashScreen from 'react-native-splash-screen';
import { defaultImages} from '../../../defaultImages';
import { defaultAuthor } from '../../../reducers/defaultData';
import { TypedNavigation } from '../../../helpers/navigation';
import { Page } from './Page';
import { Colors } from '../../../styles';
import { BoldText, MediumText, RegularText } from '../../../ui/misc/text';

export interface DispatchProps {
    onStartDownloadFeeds: () => void;
}

export interface StateProps {
    navigation: TypedNavigation;
    gatewayAddress: string;
}

type Props = DispatchProps & StateProps;

export interface State {
    authorName: string;
    authorImage: ImageData;
}

export class WelcomeScreen extends React.PureComponent<Props, State> {
    public state: State = {
        authorName: defaultAuthor.name,
        authorImage: defaultAuthor.image,
    };

    public componentDidMount() {
        SplashScreen.hide();
        this.props.onStartDownloadFeeds();
    }

    public render() {
        return (
            <Page
                backgroundColor={Colors.BRAND_PURPLE}
                leftButton={{
                    label: 'MORE ABOUT FELFELE',
                    onPress: () => Linking.openURL('https://felfele.com'),
                }}
                rightButton={{
                    label: 'GET STARTED',
                    onPress: () => this.props.navigation.navigate('ProfileOnboarding', {}),
                }}
            >
                <View
                    testID='Welcome'
                    style={{
                        paddingTop: 100,
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Image
                        source={defaultImages.iconWhiteTransparent}
                        style={{
                            width: 150,
                            height: 150,
                        }}
                    />
                    <BoldText style={[ styles.text, { fontSize: 18 } ]}>
                        Welcome to Felfele
                    </BoldText>
                    <MediumText style={[ styles.text, { fontSize: 14 } ]}>
                        Felfele lets you share posts with whoever you want but without Big Brother watching you.
                    </MediumText>
                    <RegularText style={[ styles.text, { fontSize: 14 } ]}>
                        We are a non-profit organization building products to help people take back the control of their personal data and privacy.
                    </RegularText>
                </View>
            </Page>
        );
    }
}

const styles = StyleSheet.create({
    text: {
        color: Colors.WHITE,
        textAlign: 'center',
        paddingBottom: 10,
        paddingHorizontal: 10,
    },
});
