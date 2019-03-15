import * as React from 'react';
import { FlatGrid } from 'react-native-super-grid';
import { GridCard } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { View, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { NewsSource } from '../../../models/recommendation/NewsSource';
import { RSSFeedManager } from '../../../RSSPostManager';
import { Debug } from '../../../Debug';
import { Feed } from '../../../models/Feed';

export interface StateProps {
    gatewayAddress: string;
    subCategoryName: string;
    newsSource: NewsSource[];
    navigation: any;
}

interface State {
    feeds: Feed[];
}

export class NewsSourceGridScreen extends React.Component<StateProps, State> {
    public state: State = {
        feeds: [],
    };

    public render() {
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
                <NavigationHeader title={this.props.subCategoryName} onPressLeftButton={() => this.props.navigation.goBack()}/>
                {this.state.feeds.length > 0 &&
                    <FlatGrid
                       style={{ flex: 1, backgroundColor: Colors.BACKGROUND_COLOR }}
                       spacing={10}
                       fixed={true}
                       itemDimension={170}
                       items={this.state.feeds}
                       renderItem={({ item }: any) => {
                           const imageUri = item.authorImage ? modelHelper.getImageUri(item.authorImage) : item.favicon;
                           return (
                               <GridCard
                                   title={item.name}
                                   imageUri={imageUri}
                                   onPress={() => {}}
                                   modelHelper={modelHelper}
                                   size={170}
                               />
                           );
                       }}
                   />
                }
                {this.state.feeds.length !== this.props.newsSource.length &&
                    <View style={styles.activityIndicatorContainer}>
                        <ActivityIndicator style={styles.activityIndicator} size='large'/>
                    </View>
                }
            </SafeAreaView>
        );
    }

    public componentDidMount() {
        this.props.newsSource.forEach(newsSource => {
            fetchRSSFeedFromUrl(newsSource.url).then(feed => {
                this.setState((prevState: State) => {
                    return {
                        feeds: prevState.feeds.concat(feed!),
                    };
                });
            });
        });
    }
}

const fetchRSSFeedFromUrl = async (url: string): Promise<Feed | null> => {
    try {
        const feed = await RSSFeedManager.fetchFeedFromUrl(url);
        Debug.log('fetchFeedFromUrl: feed: ', feed);
        return feed;
    } catch (e) {
        Debug.log(e);
        return null;
    }
};

const styles = StyleSheet.create({
    activityIndicatorContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
    activityIndicator: {
        paddingTop: 30,
        backgroundColor: Colors.BACKGROUND_COLOR,
    },
});
