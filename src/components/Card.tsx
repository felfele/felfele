import * as React from 'react';
import { Post } from '../models/Post';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';
import {
    View,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Linking,
    Alert,
    TouchableWithoutFeedback,
} from 'react-native';
import { TouchableView, TouchableViewProps, TouchableViewDefaultHitSlop } from './TouchableView';
import { DateUtils } from '../DateUtils';
import * as urlUtils from '../helpers/urlUtils';
import { ImageDataView } from './ImageDataView';
import { isSwarmLink } from '../swarm/Swarm';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { MediumText, RegularText, BoldText } from '../ui/misc/text';
import { Avatar } from '../ui/misc/Avatar';
import { Carousel } from '../ui/misc/Carousel';
import { Rectangle } from '../models/ModelHelper';
import { CardMarkdown } from './CardMarkdown';
import { calculateImageDimensions, ModelHelper } from '../models/ModelHelper';
import { Author } from '../models/Author';
import { Feed } from '../models/Feed';
import { DEFAULT_AUTHOR_NAME } from '../reducers/defaultData';
import { TypedNavigation } from '../helpers/navigation';
import { CardLinkPreviewDownloader} from './CardLinkPreviewDownloader';
import { markdownUnescape } from '../markdown';
import { HtmlMetaData } from '../helpers/htmlMetaData';

export interface OriginalAuthorFeed extends Feed {
    isKnownFeed: boolean;
}

export interface StateProps {
    showSquareImages: boolean;
    isSelected: boolean;
    post: Post;
    currentTimestamp: number;
    author: Author;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
    originalAuthorFeed: OriginalAuthorFeed | undefined;
}

export interface DispatchProps {
    onDeletePost: (post: Post) => void;
    onSharePost: (post: Post) => void;
    onDownloadFeedPosts: (feed: Feed) => void;
}

type CardProps = StateProps & DispatchProps;

export const Card = (props: CardProps) => {
    const httpLink = markdownUnescape(props.post.text).match(/^(http.?:\/\/.*?)($)/);
    const isHttpLink = httpLink != null;
    return (
        <View
            testID={'YourFeed/Post' + props.post._id}
            style={styles.containerPadding}
        >
            <View style={styles.container}>
                <ActionsOverlay
                    post={props.post}
                    author={props.author}
                    isSelected={props.isSelected}
                    onDeletePost={props.onDeletePost}
                    onSharePost={props.onSharePost}
                    togglePostSelection={props.togglePostSelection}
                />

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => openPost(props.post)}
                >
                    <CardTop
                        post={props.post}
                        currentTimestamp={props.currentTimestamp}
                        author={props.author}
                        modelHelper={props.modelHelper}
                        navigation={props.navigation}
                        originalAuthorFeed={props.originalAuthorFeed}
                        onSharePost={props.onSharePost}
                        togglePostSelection={props.togglePostSelection}
                        onDownloadFeedPosts={props.onDownloadFeedPosts}
                    />
                    <DisplayImage
                        post={props.post}
                        showSquareImages={props.showSquareImages}
                        modelHelper={props.modelHelper}
                    />
                    {
                        isHttpLink
                        ? <CardLinkPreviewDownloader
                            url={httpLink![1]}
                            childrenComponent={CardLinkPreview}
                            htmlMetaData={null}
                            modelHelper={props.modelHelper}
                            currentTimestamp={props.currentTimestamp}
                            navigation={props.navigation}
                            onDownloadFeedPosts={props.onDownloadFeedPosts}
                        />
                        : props.post.text === '' || <CardMarkdown text={props.post.text}/>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
};

const CardLinkPreview = (
    props: {
        htmlMetaData: HtmlMetaData | null,
        modelHelper: ModelHelper,
        currentTimestamp: number,
        navigation: TypedNavigation,
        onDownloadFeedPosts: (feed: Feed) => void,
    }
) => {
    const imageWidth = Dimensions.get('window').width - 22;
    const imageHeight = Math.floor(imageWidth * 9 / 16);
    const feedTitle = props.htmlMetaData && props.htmlMetaData.feedTitle || '';
    const name = props.htmlMetaData && props.htmlMetaData.name || feedTitle;
    const title = props.htmlMetaData && props.htmlMetaData.title;
    const description = props.htmlMetaData && props.htmlMetaData.description;
    const postUpdateTime = props.htmlMetaData && props.htmlMetaData.createdAt || 0;
    const printableTime = postUpdateTime !== 0
        ? DateUtils.printableElapsedTime(postUpdateTime, props.currentTimestamp) + ' ago'
        : ''
    ;
    const url = props.htmlMetaData && props.htmlMetaData.url || '';
    const hostnameText = url === '' ? '' : urlUtils.getHumanHostname(url);
    const timeHostSeparator = printableTime !== '' && hostnameText !== '' ? ' - ' : '';
    const onPress = props.htmlMetaData && props.htmlMetaData.feedUrl !== ''
        ? () => {
            const feed: Feed = {
                feedUrl: props.htmlMetaData!.feedUrl,
                name,
                url,
                favicon: props.htmlMetaData!.icon,
            };
            props.onDownloadFeedPosts(feed);
            props.navigation.navigate('NewsSourceFeed', { feed });
        }
        : undefined
    ;
    return (
        <TouchableView style={styles.previewContainer} onPress={() => Linking.openURL(url)}>
            <TouchableView style={styles.infoContainer} onPress={onPress}>
                <Avatar image={{uri: props.htmlMetaData && props.htmlMetaData.icon || undefined}} modelHelper={props.modelHelper} size='large' />
                <View style={styles.usernameContainer}>
                    <View style={{flexDirection: 'row'}}>
                        <MediumText style={styles.username} numberOfLines={1}>{name}</MediumText>
                    </View>
                    <RegularText numberOfLines={1} style={styles.location}>{printableTime}{timeHostSeparator}{hostnameText}</RegularText>
                </View>
            </TouchableView>

            <View>
                <ImageDataView
                    source={{
                        uri: props.htmlMetaData ? props.htmlMetaData.image : '',
                        width: imageWidth,
                        height: imageHeight,
                    }}
                    modelHelper={props.modelHelper}
                />
            </View>
            <View  style={{padding: 0 }}>
                <CardMarkdown text={`**${title}**\n\n${description}`} />
            </View>
        </TouchableView>
    );
};

const DisplayImage = (props: { post: Post, showSquareImages: boolean, modelHelper: ModelHelper }) => {
    if (props.post.images.length === 0) {
        return null;
    } else if (props.post.images.length === 1) {
        const windowWidth = Dimensions.get('window').width;
        const image = props.post.images[0];
        const { width, height } = calculateCardImageDimensions(image, windowWidth, props.showSquareImages);
        return (
            <ImageDataView
                testID={(image.uri || '')}
                key={(image.uri || '')}
                source={image}
                style={{
                    width: width,
                    height: height,
                }}
                modelHelper={props.modelHelper}
            />
        );
    } else {
        return (
            <Carousel
                testID='carousel'
                post={props.post}
                showSquareImages={props.showSquareImages}
                calculateImageDimensions={calculateImageDimensions}
                modelHelper={props.modelHelper}
            />
        );
    }
};

export const MemoizedCard = React.memo(Card);

const ActionIcon = (props: { name: string, color: string, iconSize?: number }) => {
    const iconSize = props.iconSize ||  20;
    return <Icon name={props.name} size={iconSize} color={props.color}/>;
};

const isPostShareable = (post: Post, author: Author): boolean => {
    if (post.author == null ) {
        return false;
    }
    if (post.author.identity == null) {
        // RSS post
        return true;
    }
    if (author.identity == null) {
        return false;
    }
    if (post.author.identity.publicKey === author.identity.publicKey) {
        if (post.link != null) {
            return false;
        }
        return true;
    }
    return true;
};

const ACTION_BUTTON_HIT_SLOP = {
    ...TouchableViewDefaultHitSlop,
    right: 10,
    left: 10,
};

const ActionButton = (props: TouchableViewProps) => (
    <TouchableView
        style={styles.actionButton}
        hitSlop={ACTION_BUTTON_HIT_SLOP}
        {...props}
    >{props.children}</TouchableView>
);

const ShareButton = (props: { post: Post, onSharePost: () => void, author: Author }) => {
    const isShareable = isPostShareable(props.post, props.author);
    const shareIconName = isShareable ? 'share-outline' : 'share';
    const onPress = isShareable ? () => props.onSharePost() : undefined;
    return (
        isShareable
        ?
            <ActionButton onPress={onPress}>
            { props.post.isUploading === true
                ? <ActivityIndicator color={Colors.WHITE} />
                : <ActionIcon name={shareIconName} color={Colors.WHITE}/>
            }
            </ActionButton>
        : null
    );
};

const isOwnPost = (post: Post, author: Author): boolean =>
    post.author != null && post.author.identity != null && author.identity != null &&
    post.author.identity.publicKey === author.identity.publicKey
;

const ActionsOverlay = (props: {
    post: Post,
    author: Author,
    isSelected: boolean,
    togglePostSelection: (post: Post) => void,
    onDeletePost: (post: Post) => void,
    onSharePost: (post: Post) => void,
}) => {
    const post = props.post;
    if (!props.isSelected) {
        return null;
    }
    return (
        <TouchableWithoutFeedback
            style={styles.overlay}
            onPress={() => props.togglePostSelection(post)}
        >
            <View style={styles.overlay}>
                <View style={styles.infoContainer}>
                    {isOwnPost(props.post, props.author) &&
                        <DeleteButton
                            onPress={() => {
                                onDeleteConfirmation(post, props.onDeletePost, props.togglePostSelection);
                            }}
                        />
                    }
                    <ShareButton
                        post={post}
                        onSharePost={() => {
                            props.onSharePost(post);
                            props.togglePostSelection(post);
                        }}
                        author={props.author}/>
                    <TouchableView
                        style={{
                            paddingRight: 20,
                        }}
                        hitSlop={{
                            left: 0,
                            right: 0,
                        }}
                        onPress={() => {
                            props.togglePostSelection(props.post);
                        }}>
                        <ActionIcon name='dots-vertical' color={Colors.WHITE}/>
                    </TouchableView>
                </View>
            </View>
        </TouchableWithoutFeedback>

    );
};

const DeleteButton = (props: { onPress: () => void }) => {
    return (
        <ActionButton
            onPress={props.onPress}
        >
            <ActionIcon name='delete' color={Colors.WHITE} iconSize={22}/>
        </ActionButton>
    );
};

const CardTopIcon = (props: { post: Post, modelHelper: ModelHelper }) => {
    if (props.post.author) {
        return (
            <Avatar image={props.post.author.image} modelHelper={props.modelHelper} size='large'/>
        );
    } else {
        return <View/>;
    }
};

const CardTopOriginalAuthorText = (props: {
    navigation: TypedNavigation,
    originalAuthorFeed: OriginalAuthorFeed | undefined,
    onDownloadFeedPosts: (feed: Feed) => void,
}) => {
    if (props.originalAuthorFeed == null) {
        return null;
    } else {
        const originalAuthorFeed = props.originalAuthorFeed;
        const onPress = props.originalAuthorFeed.isKnownFeed
            ? () => props.navigation.navigate('Feed', {
                feedUrl: originalAuthorFeed.feedUrl,
                name: originalAuthorFeed.name,
            })
            : () => {
                props.onDownloadFeedPosts(originalAuthorFeed);
                props.navigation.navigate('NewsSourceFeed', {
                    feed: originalAuthorFeed,
                });
            }
        ;
        return (
            <TouchableView
                style={{
                    flexDirection: 'row',
                    flex: 1,
                    paddingRight: 10,
                }}
                onPress={onPress}
            >
                <RegularText ellipsizeMode='tail' numberOfLines={1} style={styles.originalAuthor}> via {props.originalAuthorFeed.name}</RegularText>
            </TouchableView>
            );
    }
};

const CardTop = (props: {
    post: Post,
    currentTimestamp: number,
    author: Author,
    modelHelper: ModelHelper,
    navigation: TypedNavigation,
    originalAuthorFeed: OriginalAuthorFeed | undefined,
    onSharePost: (post: Post) => void,
    togglePostSelection: (post: Post) => void,
    onDownloadFeedPosts: (feed: Feed) => void,
}) => {
    const postUpdateTime = props.post.updatedAt || props.post.createdAt;
    const printableTime = DateUtils.printableElapsedTime(postUpdateTime, props.currentTimestamp) + ' ago';
    const authorName = props.post.author ? props.post.author.name : DEFAULT_AUTHOR_NAME;
    const url = props.post.link || '';
    const hostnameText = url === '' ? '' : ' -  ' + urlUtils.getHumanHostname(url);
    const onPress = props.post.author
        ? () => props.navigation.navigate('Feed', {
            feedUrl: props.post.author!.uri || '',
            name: authorName,
        })
        : undefined
        ;
    return (
        <TouchableOpacity
            testID={'CardTop'}
            onPress={onPress}
            style={styles.infoContainer}
        >
            <CardTopIcon post={props.post} modelHelper={props.modelHelper}/>
            <View style={styles.usernameContainer}>
                <View style={{flexDirection: 'row'}}>
                    <MediumText style={styles.username} numberOfLines={1}>{authorName}</MediumText>
                    <CardTopOriginalAuthorText
                        navigation={props.navigation}
                        originalAuthorFeed={props.originalAuthorFeed}
                        onDownloadFeedPosts={props.onDownloadFeedPosts}
                    />
                </View>
                <RegularText numberOfLines={1} style={styles.location}>{printableTime}{hostnameText}</RegularText>
            </View>
            <TouchableView
                style={{
                    paddingRight: 20,
                }}
                onPress={() => {
                    props.togglePostSelection(props.post);
                }}>
                <ActionIcon name='dots-vertical' color={Colors.PINKISH_GRAY}/>
            </TouchableView>
        </TouchableOpacity>
    );
};

const openPost = async (post: Post) => {
    if (post.link) {
        if (!isSwarmLink(post.link)) {
            await Linking.openURL(post.link);
        }
    }
};

const onDeleteConfirmation = (
    post: Post,
    onDeletePost: (post: Post) => void,
    togglePostSelection: (post: Post) => void,
) => {
    Alert.alert(
        'Are you sure you want to delete?',
        undefined,
        [
            {
                text: 'Cancel',
                onPress: () => Debug.log('Cancel Pressed'), style: 'cancel',
            },
            {
                text: 'OK',
                onPress: async () => {
                    await onDeletePost(post);
                    togglePostSelection(post);
                },
            },
        ],
        { cancelable: false }
    );
};

const calculateCardImageDimensions = (image: ImageData, maxWidth: number, showSquareImages: boolean): Rectangle => {
    if (showSquareImages) {
        return {
            width: maxWidth,
            height: maxWidth,
        };
    }
    return calculateImageDimensions(image, maxWidth);
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    containerPadding: {
        paddingBottom: 12,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        backgroundColor: 'rgba(98, 0, 234, 0.5)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
    },
    infoContainer : {
        flexDirection: 'row',
        height: 38,
        alignSelf: 'stretch',
        alignItems: 'center',
        marginVertical: 14,
        marginLeft: 10,
    },
    usernameContainer: {
        justifyContent: 'center',
        flexDirection: 'column',
        marginLeft: 10,
        flex: 1,
    },
    location: {
        fontSize: 14,
        color: Colors.DARK_GRAY,
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: Colors.WHITE,
        backgroundColor: Colors.BRAND_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    username: {
        fontSize: 14,
        color: Colors.DARK_GRAY,
    },
    originalAuthor: {
        fontSize: 14,
        fontWeight: 'normal',
        color: Colors.GRAY,
    },
    previewContainer: {
        marginHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.LIGHT_GRAY,
        flexDirection: 'column',
    },
});
