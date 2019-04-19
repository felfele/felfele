import * as React from 'react';
import { FlatGrid } from 'react-native-super-grid';
import { GridCard } from '../../misc/GridCard';
import { ReactNativeModelHelper } from '../../../models/ReactNativeModelHelper';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ComponentColors } from '../../../styles';
import { NavigationHeader } from '../../../components/NavigationHeader';
import { NewsSource } from '../../../models/recommendation/NewsSource';
import { RSSFeedManager } from '../../../RSSPostManager';
import { Debug } from '../../../Debug';
import { Feed } from '../../../models/Feed';
import { TypedNavigation } from '../../../helpers/navigation';
import { TabBarPlaceholder } from '../../misc/TabBarPlaceholder';
import { FragmentSafeAreaViewWithoutTabBar } from '../../misc/FragmentSafeAreaView';

export interface StateProps {
    gatewayAddress: string;
    subCategoryName: string;
    newsSource: NewsSource[];
    navigation: TypedNavigation;
}

export interface DispatchProps {
    downloadPostsForNewsSource: (feed: Feed) => void;
}

interface State {
    feeds: Feed[];
    feedLoadCounter: number;
}

export class NewsSourceGridScreen extends React.Component<StateProps & DispatchProps, State> {
    public state: State = {
        feeds: [],
        feedLoadCounter: 0,
    };

    public render() {
        const modelHelper = new ReactNativeModelHelper(this.props.gatewayAddress);
        return (
            <FragmentSafeAreaViewWithoutTabBar>
                <NavigationHeader title={this.props.subCategoryName} navigation={this.props.navigation}/>
                {this.state.feeds.length > 0 &&
                    <FlatGrid
                       style={{ flex: 1, backgroundColor: ComponentColors.BACKGROUND_COLOR }}
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
                                   onPress={() => {
                                       this.props.downloadPostsForNewsSource(item);
                                       this.props.navigation.navigate('NewsSourceFeed', {
                                           feed: item,
                                       });
                                   }}
                                   modelHelper={modelHelper}
                                   size={170}
                               />
                           );
                       }}
                   />
                }
                {this.state.feedLoadCounter !== this.props.newsSource.length &&
                    <View style={styles.activityIndicatorContainer}>
                        <ActivityIndicator style={styles.activityIndicator} size='large'/>
                    </View>
                }
                <TabBarPlaceholder color={ComponentColors.BACKGROUND_COLOR}/>
            </FragmentSafeAreaViewWithoutTabBar>
        );
    }

    public componentDidMount() {
        this.props.newsSource.forEach(newsSource => {
            fetchRSSFeedFromUrl(newsSource.url)
                .then(feed => {
                    if (feed != null) {
                        this.setState((prevState: State) => {
                            return {
                                feeds: prevState.feeds.concat(feed),
                                feedLoadCounter: prevState.feedLoadCounter + 1,
                            };
                        });
                    } else {
                        Debug.log(`failed to load ${newsSource.url}`);
                        this.setState((prevState: State) => {
                            return {
                                feedLoadCounter: prevState.feedLoadCounter + 1,
                            };
                        });
                    }
                })
            ;
        });
    }
}

const fetchRSSFeedFromUrl = async (url: string): Promise<Feed | null> => {
    try {
        const feed = await RSSFeedManager.fetchFeedFromUrl(url);
        Debug.log('NewsSourceGridScreen.fetchFeedFromUrl', {feed});
        return feed;
    } catch (e) {
        Debug.log(e);
        return null;
    }
};

const styles = StyleSheet.create({
    activityIndicatorContainer: {
        flex: 1,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
    activityIndicator: {
        paddingTop: 30,
        backgroundColor: ComponentColors.BACKGROUND_COLOR,
    },
});
