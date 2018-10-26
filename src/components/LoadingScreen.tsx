import * as React from 'react';
import {
    View,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Author } from '../models/Post';

export interface DispatchProps { }

export interface StateProps {
    author: Author;
    navigation: any;
}

export const LoadingScreen = (props: DispatchProps & StateProps) => {
    return (
        <View>
            {props.author.name === '' ? props.navigation.navigate('Welcome') : props.navigation.navigate('App')}
        </View>
    );
};