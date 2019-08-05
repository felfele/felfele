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

interface ShareState {
    store: any;
    persistor: Persistor | null;
    type: any;
    value: any;
}

export default class FelfeleShareExtension extends React.Component<{}, ShareState> {
    public state: ShareState = {
        store: null,
        persistor: null,
        type: null,
        value: null,
    };

    public render() {
        if (this.state.store == null) {
            Debug.log("won't render");
            return null;
        }
        Debug.log('will render');
        return (
            <TopLevelErrorBoundary>
                <Provider store={this.state.store!}>
                    <PersistGate loading={null} persistor={this.state.persistor!}>
                        <SharePostEditorContainer
                            text={this.state.value}
                            goBack={() => {
                                this.state.store.dispatch(Actions.updateAppLastEditing(FELFELE_SHARE_EXTENSION_NAME));
                                this.state.persistor!.flush().then(() => {
                                    ShareExtension.close();
                                });
                                return true;
                            }}
                            dismiss={() => {
                                ShareExtension.close();
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
            this.setState({
                store,
                persistor,
                type,
                value,
            });
        } catch (e) {
            Debug.log('error getting share data', e);
        }
    }
}
