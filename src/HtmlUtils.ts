// @ts-ignore
import { parse } from 'react-native-parse-html';

export interface HtmlAttrNameValue {
    name: string;
    value: string;
}

export class HtmlUtils {
    public static parse(html: any): HTMLElement {
        return parse(html);
    }

    public static findPath(node: Node, path: string[]): Node[] {
        const foundNodes: Node[] = [];
        const pathPart = path[0];
        for (const childNode of node.childNodes) {
            if (childNode.nodeName === pathPart) {
                if (path.length > 1) {
                    return HtmlUtils.findPath(childNode, path.slice(1));
                } else {
                    foundNodes.push(childNode);
                }
            }
        }

        return foundNodes;
    }

    public static matchAttributes(node: any, attrs: HtmlAttrNameValue[]): boolean {
        for (const attr of attrs) {
            let found = false;
            for (const nodeAttr of node.attrs) {
                if (nodeAttr.name === attr.name && nodeAttr.value === attr.value) {
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

    public static getAttribute(node: any, name: string): string | null {
        for (const attr of node.attrs) {
            if (attr.name === name) {
                return attr.value;
            }
        }
        return null;
    }
}
