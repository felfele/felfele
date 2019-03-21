import * as React from 'react';
// @ts-ignore
import Onboarding from 'react-native-onboarding-swiper';
import {
    Image,
} from 'react-native';

import { IdentityOnboarding, DispatchProps as IdentityOnboardingDispatchProps  } from '../components/IdentityOnboarding';
import { ImageData } from '../models/ImageData';
import SplashScreen from 'react-native-splash-screen';
import { Colors } from '../styles';
import { defaultAuthor } from '../reducers';

export interface DispatchProps {
    onStartDownloadFeeds: () => void;
    onCreateUser: (name: string, image: ImageData, navigation: any) => void;
}

export interface StateProps {
    navigation: any;
    gatewayAddress: string;
}

type Props = DispatchProps & StateProps;

export interface State {
    authorName: string;
    authorImage: ImageData;
}

export class Welcome extends React.PureComponent<Props, State> {
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
            <Onboarding
                flatlistProps={{
                    keyboardShouldPersistTaps: 'handled',
                }}
                pages={[{
                    backgroundColor: Colors.BRAND_PURPLE,
                    image: <Image source={require('../../images/icon-white-transparent.png')} style={{
                        width: 150,
                        height: 150,
                    }}/>,
                    title: 'Welcome to Felfele',
                    subtitle: 'Socialize without Compromise',
                }, {
                    backgroundColor: Colors.BRAND_PURPLE,
                    image: <IdentityOnboarding
                        onUpdateAuthor={(text: string) => {
                            this.setState({
                                authorName: text,
                            });
                        }}
                        onUpdatePicture={(image: ImageData) => {
                            this.setState({
                                authorImage: image,
                            });
                        }}
                        author={{
                            ...defaultAuthor,
                            name: this.state.authorName,
                            image: this.state.authorImage,
                        }}
                        gatewayAddress={this.props.gatewayAddress}
                    />,
                    title: 'Get Started',
                    subtitle: 'Pick a name and an avatar',
                },
                ]}
                onDone={() => {
                    this.props.onCreateUser(
                        this.state.authorName !== '' ? this.state.authorName : defaultAuthor.name,
                        this.state.authorImage,
                        this.props.navigation,
                    );
                }}
                showSkip={false}
            />
        );
    }
}
