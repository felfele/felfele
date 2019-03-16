import * as React from 'react';
import {
    View,
} from 'react-native';
import { Author } from '../models/Author';

export interface DispatchProps { }

export interface StateProps {
    author: Author;
    navigation: any;
}

export const LoadingScreen = (props: DispatchProps & StateProps) => {
    return (
        <View>
            {props.author.identity == null ? props.navigation.navigate('Welcome') : props.navigation.navigate('App')}
        </View>
    );
};
