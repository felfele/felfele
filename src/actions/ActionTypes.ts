export enum ActionTypes {
    ADD_CONTENT_FILTER = 'ADD-CONTENT-FILTER',
    REMOVE_CONTENT_FILTER = 'REMOVE-CONTENT-FILTER',
    CLEANUP_CONTENT_FILTERS = 'CLEANUP-CONTENT-FILTERS',
    ADD_FEED = 'ADD-FEED',
    REMOVE_FEED = 'REMOVE-FEED',
    FOLLOW_FEED = 'FOLLOW-FEED',
    UNFOLLOW_FEED = 'UNFOLLOW-FEED',
    TOGGLE_FEED_FAVORITE = 'TOGGLE-FEED-FAVORITE',
    UPDATE_FEED_FAVICON = 'UPDATE-FEED-FAVICON',
    ADD_OWN_FEED = 'ADD-OWN-FEED',
    UPDATE_OWN_FEED = 'UPDATE-OWN-FEED',
    TIME_TICK = 'TIME-TICK',
    UPDATE_RSS_POSTS = 'UPDATE-RSS-POSTS',
    REMOVE_POST = 'REMOVE-POST',
    ADD_DRAFT = 'ADD-DRAFT',
    REMOVE_DRAFT = 'REMOVE-DRAFT',
    ADD_POST = 'ADD-POST',
    DELETE_POST = 'DELETE-POST',
    UPDATE_POST_LINK = 'UPDATE-POST-LINK',
    UPDATE_POST_IMAGES = 'UPDATE-POST-IMAGES',
    UPDATE_POST_IS_UPLOADING = 'UPDATE-POST-IS-UPLOADING',
    UPDATE_AUTHOR_NAME = 'UPDATE-AUTHOR-NAME',
    UPDATE_AUTHOR_IMAGE = 'UPDATE-AUTHOR-IMAGE',
    UPDATE_AUTHOR_IDENTITY = 'UPDATE-AUTHOR-IDENTITY',
    INCREASE_HIGHEST_SEEN_POST_ID = 'INCREASE-HIGHEST-SEEN-POST-ID',
    APP_STATE_RESET = 'APP-STATE-RESET',
    APP_STATE_SET = 'APP-STATE-SET',
    CHANGE_SETTING_SAVE_TO_CAMERA_ROLL = 'CHANGE-SETTING-SAVE-TO-CAMERA-ROLL',
    CHANGE_SETTING_SHOW_SQUARE_IMAGES = 'CHANGE-SETTING-SHOW-SQUARE-IMAGES',
    CHANGE_SETTING_SHOW_DEBUG_MENU = 'CHANGE-SETTING-SHOW-DEBUG-MENU',
    CHANGE_SETTING_SWARM_GATEWAY_ADDRESS = 'CHANGE-SETTING-SWARM-GATEWAY-ADDRESS',
    CLEAN_FEEDS_FROM_OWN_FEEDS = 'CLEAN-FEEDS-FROM-OWN-FEEDS',
    ADD_CONTACT = 'ADD-CONTACT',
    UPDATE_CONTACT_STATE = 'UPDATE-CONTACT-STATE',
    CONFIRM_CONTACT = 'CONFIRM-CONTACT',
    REMOVE_CONTACT = 'REMOVE-CONTACT',
    DELETE_ALL_CONTACTS = 'DELETE-ALL-CONTACTS',
}
