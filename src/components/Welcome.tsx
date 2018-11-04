import * as React from 'react';
import Onboarding from 'react-native-onboarding-swiper';
import {
    Image,
} from 'react-native';
import { IdentityOnboardingContainer } from '../containers/IdentitySettingsContainer';

export interface DispatchProps {
    onCreateIdentity: () => void;
}

export interface StateProps {
    navigation: any;
}

export const Welcome = (props: DispatchProps & StateProps) => {
    return (
        <Onboarding
            pages={[{
                backgroundColor: 'teal',
                image: <Image source={require('../../images/network.png')} style={{
                    width: 150,
                    height: 150,
                }}/>,
                title: 'Welcome to Felfele',
                subtitle: 'Socialize without Compromise',
            }, {
                backgroundColor: 'teal',
                image: <IdentityOnboardingContainer/>,
                title: 'Get Started',
                subtitle: 'Pick a name and an avatar',
            },
            ]}
            onDone={() => {
                props.onCreateIdentity();
                props.navigation.navigate('Loading');
            }}
        />
    );
};
