import * as React from 'react';
import { Post, PostReferences } from '../models/Post';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles';
import {
    View,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Platform,
    StyleSheet,
    Linking,
    Alert,
    TouchableWithoutFeedback,
} from 'react-native';
import { TouchableView } from './TouchableView';
import { DateUtils } from '../DateUtils';
import * as urlUtils from '../helpers/urlUtils';
import { ImageDataView } from './ImageDataView';
import { isSwarmLink } from '../swarm/Swarm';
import { ImageData } from '../models/ImageData';
import { Debug } from '../Debug';
import { MediumText, RegularText } from '../ui/misc/text';
import { Avatar } from '../ui/misc/Avatar';
import { Carousel } from '../ui/misc/Carousel';
import { Rectangle } from '../models/ModelHelper';
import { CardMarkdown } from './CardMarkdown';
import { calculateImageDimensions, ModelHelper } from '../models/ModelHelper';
import { Author } from '../models/Author';
import { DEFAULT_AUTHOR_NAME } from '../reducers/defaultData';
import { TypedNavigation } from '../helpers/navigation';

export interface StateProps {
    showSquareImages: boolean;
    isSelected: boolean;
    post: Post;
    currentTimestamp: number;
    author: Author;
    modelHelper: ModelHelper;
    togglePostSelection: (post: Post) => void;
    navigation: TypedNavigation;
}

export interface DispatchProps {
    onDeletePost: (post: Post) => void;
    onSharePost: (post: Post) => void;
}

type CardProps = StateProps & DispatchProps;

export const Card = (props: CardProps) => {
    return (
        <View
            testID={'YourFeed/Post' + props.post._id}
            style={{
                paddingBottom: 12,
            }}
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
                        onSharePost={props.onSharePost}
                        togglePostSelection={props.togglePostSelection}
                    />
                    <DisplayImage
                        post={props.post}
                        showSquareImages={props.showSquareImages}
                        modelHelper={props.modelHelper}
                    />
                    { props.post.text === '' ||
                        <CardMarkdown text={props.post.text}/>
                    }
                </TouchableOpacity>
            </View>
        </View>
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

const ShareButton = (props: { post: Post, onSharePost: () => void, author: Author }) => {
    const isShareable = isPostShareable(props.post, props.author);
    const shareIconName = isShareable ? 'share-outline' : 'share';
    const onPress = isShareable ? () => props.onSharePost() : undefined;
    return (
        <TouchableView style={styles.actionButton} onPress={onPress}>
        { props.post.isUploading === true
            ? <ActivityIndicator color={Colors.WHITE} />
            : <ActionIcon name={shareIconName} color={Colors.WHITE}/>
        }
        </TouchableView>
    );
};

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
                <DeleteButton
                    onPress={() => {
                        onDeleteConfirmation(post, props.onDeletePost, props.togglePostSelection);
                    }
                }/>
                <ShareButton
                    post={post}
                    onSharePost={() => {
                        props.onSharePost(post);
                        props.togglePostSelection(post);
                    }}
                    author={props.author}/>
            </View>
        </TouchableWithoutFeedback>

    );
};

const DeleteButton = (props: { onPress: () => void }) => {
    return (
        <TouchableView
            style={styles.actionButton}
            onPress={props.onPress}
        >
            <ActionIcon name='trash-can' color={Colors.WHITE} iconSize={24}/>
        </TouchableView>
    );
};

const CardTopIcon = (props: { post: Post, modelHelper: ModelHelper }) => {
    if (props.post.author) {
        const imageUri = props.modelHelper.getImageUri(props.post.author.image);
        return (
            <Avatar imageUri={imageUri} size='large'/>
        );
    } else {
        return <View/>;
    }
};

const CardTopOriginalAuthorText = (props: {
    references: PostReferences | undefined,
    navigation: TypedNavigation,
}) => {
    if (props.references == null || props.references.originalAuthor == null) {
        return null;
    } else {
        const feedUrl = props.references.originalAuthor.uri;
        const name = props.references.originalAuthor.name;
        return (
            <TouchableView
                style={{flexDirection: 'row'}}
                onPress={() => props.navigation.navigate('Feed', {
                    feedUrl,
                    name,
                })}
            >
                <RegularText style={styles.originalAuthor}> via {props.references.originalAuthor.name}</RegularText>
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
    onSharePost: (post: Post) => void,
    togglePostSelection: (post: Post) => void,
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
                        references={props.post.references}
                        navigation={props.navigation}
                    />
                </View>
                <RegularText style={styles.location}>{printableTime}{hostnameText}</RegularText>
            </View>
            <TouchableView
                style={{
                    paddingRight: 10,
                }}
                onPress={() => {
                    props.togglePostSelection(props.post);
                }}>
                <ActionIcon name='dots-vertical' color={Colors.DARK_GRAY}/>
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

const HeaderOffset = 20;
const TranslucentBarHeight = Platform.OS === 'ios' ? HeaderOffset : 0;
const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer : {
        flexDirection: 'row',
        height: 38,
        alignSelf: 'stretch',
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
    itemImageContainer: {
        flexDirection: 'row',
        height: 40,
        alignSelf: 'stretch',
        marginLeft: 5,
        marginTop: 5,
        justifyContent: 'space-evenly',
    },
    actionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.WHITE,
        backgroundColor: Colors.BRAND_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
    },
    likeCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 2,
    },
    commentItem: {
        fontSize: 10 ,
        color: 'rgba(0, 0, 0, 0.5)',
        marginTop: 5,
    },
    captionContainer: {
        marginTop: 2 ,
        flexDirection: 'row',
        alignItems: 'center',
    },
    captionText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 8,
        color: 'rgba(0, 0, 0, 0.5)',
        marginTop: 5,
    },
    seperator: {
        height: 1,
        alignSelf: 'stretch',
        marginHorizontal: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    hashTag: {
        fontStyle: 'italic',
        color: 'blue',
    },
    footer: {
        marginVertical: 5,
        alignSelf: 'stretch',
        marginHorizontal: 20,
        flexDirection: 'column',
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
    text: {
        fontSize: 12,
        color: Colors.DARK_GRAY,
    },
    likedContainer: {
        backgroundColor: 'transparent',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    translucentBar: {
        height: TranslucentBarHeight,
        width: '100%',
        position: 'absolute',
        backgroundColor: '#e6e6e6ff',
        opacity: 0.5,
        top: 0,
        left: 0,
    },
    refreshControl: {
    },
});
