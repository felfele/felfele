import * as React from 'react';
import { HtmlMetaData, fetchHtmlMetaData } from '../helpers/htmlMetaData';
import { ModelHelper } from '../models/ModelHelper';
import { TypedNavigation } from '../helpers/navigation';
import { Feed } from '../models/Feed';

interface CardPreviewProps {
    htmlMetaData: HtmlMetaData | null;
    modelHelper: ModelHelper;
    currentTimestamp: number;
    navigation: TypedNavigation;
    onDownloadFeedPosts: (feed: Feed) => void;
}

interface Props extends CardPreviewProps {
    url: string;
    childrenComponent: (props: CardPreviewProps) => JSX.Element | null;
}

interface State {
    isLoading: boolean;
    htmlMetaData: HtmlMetaData | null;
}

export class CardLinkPreviewDownloader extends React.Component<Props, State> {
    public state: State = {
        isLoading: true,
        htmlMetaData: null,
    };

    public componentDidMount = async () => {
        const htmlMetaData = await fetchHtmlMetaData(this.props.url);
        console.log('CardLinkPreviewDownloader.componentDidMount', {htmlMetaData});
        this.setState({
            isLoading: false,
            htmlMetaData,
        });
    }

    public render() {
        return this.props.childrenComponent({
            ...this.props,
            htmlMetaData: this.state.htmlMetaData,
        });
    }
}
