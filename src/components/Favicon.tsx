import * as React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { DefaultStyle, IconSize } from '../styles';
import { downloadAvatarAndStore } from '../ImageDownloader';

export interface StateProps {
    url: string;
}

export interface DispatchProps {
}

export type Props = StateProps & DispatchProps;

export interface State {
    isLoaded: boolean;
    path: string;
}

export class Favicon extends React.Component<Props, State> {
    public constructor(props) {
        super(props);
        this.state = {
            path: props.url,
            isLoaded: false,
        };
        console.log('Favicon', props.url);
    }

    public componentDidMount = () => {
        downloadAvatarAndStore(this.props.url).then(path => this.setState({
            path,
            isLoaded: true,
        }));
    }

    public render() {
        return (
            <View>
                {this.state.isLoaded ?
                    <Image
                        source={{
                            uri: this.state.path,
                            width: IconSize.LARGE_LIST_ICON,
                            height: IconSize.LARGE_LIST_ICON,
                        }}
                        style={DefaultStyle.favicon}
                    />
                    :
                    <View style={DefaultStyle.favicon} />
                }
            </View>
        );
    }
}
