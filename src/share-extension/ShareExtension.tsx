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

interface ShareState {
    store: any;
    persistor: Persistor | null;
    type: any;
    value: any;
}

export default class FelfeleShareExtension extends React.Component<{}, ShareState> {
    public state = {
        store: null,
        persistor: null,
        type: null,
        value: null,
    };

    public render() {
        if (this.state.store == null) {
            return null;
        }
        return (
            <TopLevelErrorBoundary>
                <Provider store={this.state.store!}>
                    <PersistGate loading={null} persistor={this.state.persistor!}>
                        <SharePostEditorContainer text={this.state.value}/>
                    </PersistGate>
                </Provider>
            </TopLevelErrorBoundary>
        );
    }

    public async componentDidMount() {
        const { store, persistor } = await initStore();
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
