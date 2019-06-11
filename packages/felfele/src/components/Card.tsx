import * as React from 'react';
import {
    Post,
    isSwarmLink,
    ImageData,
    Debug,
    Rectangle,
    Author,
    Feed,
    calculateImageDimensions,
    ModelHelper,
} from '@felfele/felfele-core';
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
import { DateUtils } from '@felfele/felfele-core';
import * as urlUtils from '../helpers/urlUtils';
import { ImageDataView } from './ImageDataView';
import { MediumText, RegularText } from '../ui/misc/text';
import { Avatar } from '../ui/misc/Avatar';
import { Carousel } from '../ui/misc/Carousel';
import { CardMarkdown } from './CardMarkdown';
import { DEFAULT_AUTHOR_NAME } from '../reducers/defaultData';
import { TypedNavigation } from '../helpers/navigation';

export interface AuthorFeed extends Feed {
    isKnownFeed: boolean;
}

export interface StateProps {
    isSelected: boolean;
    post: Post;
    currentTimestamp: number;
    author: Author;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
    authorFeed: AuthorFeed | undefined;
    originalAuthorFeed: AuthorFeed | undefined;
}

export interface DispatchProps {
    onDeletePost: (post: Post) => void;
    onSharePost: (post: Post) => void;
    onDownloadFeedPosts: (feed: Feed) => void;
}

type CardProps = StateProps & DispatchProps;

export const Card = (props: CardProps) => {
    const width = Dimensions.get('screen').width;
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
                    <CardBody
                        {...props}
                        width={width}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const CardBody = (props: {
    post: Post,
    currentTimestamp: number,
    width: number,
    modelHelper: ModelHelper,
    navigation: TypedNavigation,
    originalAuthorFeed: AuthorFeed | undefined,
    authorFeed: AuthorFeed | undefined;
    togglePostSelection?: (post: Post) => void;
    onDownloadFeedPosts: (feed: Feed) => void;
}) => {
    const isOriginalPost = props.post.references == null;
    const originalAuthor = props.post.references != null
        ? props.post.references.originalAuthor
        : props.post.author
    ;
    const originalPost = {
        ...props.post,
        author: originalAuthor,
        references: undefined,
    };
    const authorFeed = props.authorFeed;
    const cardTopOnPress = authorFeed != null
        ? authorFeed.isKnownFeed
            ? () => props.navigation.navigate('Feed', {
                feedUrl: authorFeed.feedUrl,
                name: authorFeed.name,
            })
            : authorFeed.feedUrl !== ''
                ?   () => {
                    props.onDownloadFeedPosts(authorFeed);
                    props.navigation.navigate('NewsSourceFeed', {
                        feed: authorFeed,
                    });
                }
            : undefined
        : undefined
    ;
    return (
        <View>
            <CardTop
                post={props.post}
                currentTimestamp={props.currentTimestamp}
                modelHelper={props.modelHelper}
                togglePostSelection={props.togglePostSelection}
                onPress={cardTopOnPress}
            />
            {
                isOriginalPost
                    ?
                    <View>
                        <DisplayImage
                            post={props.post}
                            modelHelper={props.modelHelper}
                            width={props.width}
                        />
                        {
                            props.post.text === '' || <CardMarkdown text={props.post.text} />
                        }
                    </View>
                    :
                    <View style={styles.previewContainer}>
                        <CardBody
                            {...props}
                            authorFeed={props.originalAuthorFeed}
                            originalAuthorFeed={undefined}
                            togglePostSelection={undefined}
                            post={originalPost}
                            currentTimestamp={originalPost.createdAt}
                            width={props.width - 22}
                        />
                    </View>
            }
        </View>
    );
};

const DisplayImage = (props: {
    post: Post,
    modelHelper: ModelHelper,
    width: number,
}) => {
    if (props.post.images.length === 0) {
        return null;
    } else if (props.post.images.length === 1) {
        const image = props.post.images[0];
        const defaultImageWidth = props.width;
        const defaultImageHeight = Math.floor(defaultImageWidth * 0.66);

        const { width, height } = calculateImageDimensions(image, defaultImageWidth, defaultImageHeight);
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

const CardTop = (props: {
    post: Post,
    currentTimestamp: number,
    modelHelper: ModelHelper,
    togglePostSelection?: (post: Post) => void,
    onPress?: () => void;
}) => {
    const postUpdateTime = props.post.updatedAt || props.post.createdAt;
    const printableTime = DateUtils.printableElapsedTime(postUpdateTime, props.currentTimestamp) + ' ago';
    const authorName = props.post.author ? props.post.author.name : DEFAULT_AUTHOR_NAME;
    const url = props.post.link || '';
    const hostnameText = url === '' ? '' : urlUtils.getHumanHostname(url);
    const timeHostSeparator = printableTime !== '' && hostnameText !== '' ? ' - ' : '';
    return (
        <TouchableOpacity
            testID={'CardTop'}
            onPress={props.onPress}
            style={styles.infoContainer}
        >
            <CardTopIcon post={props.post} modelHelper={props.modelHelper}/>
            <View style={styles.usernameContainer}>
                <View style={{flexDirection: 'row'}}>
                    <MediumText style={styles.username} numberOfLines={1}>{authorName}</MediumText>
                </View>
                <RegularText numberOfLines={1} style={styles.location}>{printableTime}{timeHostSeparator}{hostnameText}</RegularText>
            </View>
            {
                props.togglePostSelection &&
                <TouchableView
                    style={{
                        paddingRight: 20,
                    }}
                    onPress={() => props.togglePostSelection!(props.post)}>
                    <ActionIcon name='dots-vertical' color={Colors.PINKISH_GRAY}/>
                </TouchableView>

            }
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

const calculateCardImageDimensions = (image: ImageData, maxWidth: number, maxHeight: number): Rectangle => {
    return calculateImageDimensions(image, maxWidth, maxHeight);
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
