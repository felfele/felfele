import * as React from 'react';
import { View, Image } from 'react-native';
import { DefaultStyle, IconSize } from '../styles';
import { FileSystem } from '../FileSystem';

export interface StateProps {
    url: string;
}

export interface DispatchProps {
    tryDownloadAndStoreAvatar: (url: string) => void;
}

export type Props = StateProps & DispatchProps;

class Favicon extends React.PureComponent<Props> {
    public componentDidMount = () => {
        if (!FileSystem.isLocalPath(this.props.url)) {
            this.props.tryDownloadAndStoreAvatar(this.props.url);
        }
    }

    public render() {
        return (
            <View>
                <Image
                    source={{
                            uri: this.props.url,
                            width: IconSize.LARGE_LIST_ICON,
                            height: IconSize.LARGE_LIST_ICON,
                        }}
                        style={DefaultStyle.favicon}
                    />
            </View>
        );
    }
}

export const MemoizedFavicon = React.memo(Favicon);
