
import { parse } from 'react-native-parse-html';

export interface HtmlAttrNameValue {
    name: string;
    value: string;
}

export class HtmlUtils {
    static parse(html) {
        return parse(html);
    }

    static findPath(node, path) {
        let foundNodes:any[] = [];
        const pathPart = path[0];
        for (const childNode of node.childNodes) {
            if (childNode.nodeName == pathPart) {
                if (path.length > 1) {
                    return HtmlUtils.findPath(childNode, path.slice(1));
                } else {
                    foundNodes.push(childNode);
                }
            }
        }

        return foundNodes;
    }

    static matchAttributes(node, attrs: HtmlAttrNameValue[]) {
        for (const attr of attrs) {
            let found = false;
            for (const nodeAttr of node.attrs) {
                if (nodeAttr.name == attr.name && nodeAttr.value == attr.value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    static getAttribute(node, name) {
        for (const attr of node.attrs) {
            if (attr.name == name) {
                return attr.value;
            }
        }
        return null;
    }
}