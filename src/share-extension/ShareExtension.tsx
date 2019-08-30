import * as React from 'react';
import { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
// @ts-ignore
import ShareExtension from 'react-native-share-extension';

import { TopLevelErrorBoundary } from '../components/TopLevelErrorBoundary';
import { initStore } from '../store';
import { SharePostEditorContainer } from './SharePostEditorContainer';
import { Debug } from '../Debug';
import { Actions } from '../actions/Actions';
import { FELFELE_SHARE_EXTENSION_NAME } from '../reducers/defaultData';
import { Image } from 'react-native';
import { ImageData } from '../models/ImageData';
import { ShareNavigator } from './ShareNavigator';

interface ShareState {
    store: any;
    persistor: Persistor | null;
    images: ImageData[];
    text: string;
}

export default class FelfeleShareExtension extends React.Component<{}, ShareState> {
    public state: ShareState = {
        store: null,
        persistor: null,
        images: [],
        text: '',
    };

    public render() {
        if (this.state.store == null) {
            return null;
        }
        return (
            <TopLevelErrorBoundary>
                <Provider store={this.state.store!}>
                    <PersistGate loading={null} persistor={this.state.persistor!}>
                        <ShareNavigator
                            screenProps={{
                                images: this.state.images,
                                text: this.state.text,
                                goBack: () => {
                                    this.state.store.dispatch(Actions.updateAppLastEditing(FELFELE_SHARE_EXTENSION_NAME));
                                    this.state.persistor!.flush().then(() => {
                                        ShareExtension.close();
                                    });
                                    return true;
                                },
                                dismiss: () => {
                                    ShareExtension.close();
                                },
                            }}
                        />
                    </PersistGate>
                </Provider>
            </TopLevelErrorBoundary>
        );
    }

    public async componentDidMount() {
        const { store, persistor } = await initStore(() => {});
        try {
            const { type, value } =  await ShareExtension.data();
            let text: string = '';
            if (type === 'text/plain') {
                text = value as string;
                this.setState({
                    store,
                    persistor,
                    text,
                });
            } else if (type === 'image/*') {
                Image.getSize(value, (width, height) => {
                    this.setState({
                        store,
                        persistor,
                        images: [ { width, height, localPath: value } ],
                    });

                }, (e) => {
                    Debug.log('error sharing image', e);
                });
            } else {
                throw new Error('Unsupported media format for sharing');
            }
        } catch (e) {
            Debug.log('error getting share data', e);
        }
    }
}
