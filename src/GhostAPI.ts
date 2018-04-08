import { LoginData } from './models/LoginData';
import { AuthenticationData, AuthenticationDefaultKey } from './models/AuthenticationData';
import { Storage } from './Storage';
import { ImageData } from './models/Post';
import { Config } from './Config';
import { Utils } from './Utils';

export interface Draft {
    title: string;
    slug: string | null;
    markdown: string;
    image: string | null;
    featured: boolean;
    page: boolean;
    status: 'published' | 'draft';
    language: 'en_US';
    meta_title: string | null;
    meta_description: string | null;
    author: string;
    publishedBy: string | null;
    tags: string[];
}

export interface Post extends Draft {
    id: number;
    uuid?: string;
    mobiledoc?: string;
    html?: string;
    amp?: string;
    created_at: string;
    created_by: number;
    updated_at: string;
    updated_by: number;
    published_at: string | null;
    published_by?: string;
    url?: string;
}

export class GhostAPI {
    constructor(private baseUri, private loginData, private authenticationData: AuthenticationData) {
    }

    private async handleResponseErrors(responsePromise: Promise<Response>) {
        let response;
        try {
            response = await Utils.timeout(Config.defaultTimeout, responsePromise);
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
        if (!response.ok) {
            if (response.status === 401) {
                this.authenticationData.loginState = 'logged-out';
            }
            console.error(response);
            const text = await response.text();
            throw new Error('' + response.status + ' ' + response.statusText + ' ' + response.url + ' ' + text);
        }
        return response;
    }

    private async uploadImage(imageUri: string) {
        const uri = this.baseUri + 'ghost/api/v0.1/uploads/';

        const photo = {
            uri: imageUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        };

        try {
            const form = new FormData();
            form.append('uploadimage', JSON.stringify(photo));

            const response = await this.callApi('POST', uri, form, 'multipart/form-data');
            const textResponse = await response.text();
            console.log('uploadImage textResponse', textResponse);
            return textResponse;
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    private async uploadPost(markdown: string, createdAt: string): Promise<number> {
        try {
            const response = await this.uploadDraft(markdown);
            const draftResponse = await response.json();
            console.log('uploadPost draftResponse', draftResponse);
            draftResponse.posts[0].created_at = createdAt;
            const postResponse = await this.publishPost(draftResponse.posts[0]);
            const post = await postResponse.json();
            console.log('uploadPost draftResponse', post);
            return post.posts[0].id;
        } catch (e) {
            console.error('Upload failed ', e);
            throw new Error(e);
        }
    }

    private publishPost(draftResponse) {
        const id = draftResponse.id;
        const uri = this.baseUri + 'ghost/api/v0.1/posts/' + id + '/?include=tags';
        const post: Post = {
            id: draftResponse.id,
            slug: draftResponse.slug,
            title: '(Untitled)',
            markdown: draftResponse.markdown,
            image: null,
            featured: false,
            page: false,
            status: 'published',
            language: 'en_US',
            updated_at: draftResponse.updated_at,
            updated_by: draftResponse.updated_by,
            published_at: null,
            created_at: draftResponse.created_at,
            created_by: draftResponse.created_by,
            meta_title: null,
            meta_description: null,
            author: '' + this.authenticationData.userId,
            publishedBy: null,
            tags: [],
        };

        const body = JSON.stringify({
            posts: [post],
        });
        return this.callApi('PUT', uri, body);
    }

    private uploadDraft(markdown) {
        const uri = this.baseUri + 'ghost/api/v0.1/posts/?include=tags';
        const draft: Draft = {
            title: '(Untitled)',
            slug: null,
            markdown: markdown,
            image: null,
            featured: false,
            page: false,
            status: 'draft',
            language: 'en_US',
            meta_title: null,
            meta_description: null,
            author: '' + this.authenticationData.userId,
            publishedBy: null,
            tags: [],
        };

        const body = JSON.stringify({
            posts: [draft],
        });
        return this.callApi('POST', uri, body);
    }

    private deletePost(id) {
        const uri = this.baseUri + 'ghost/api/v0.1/posts/' + id + '/?include=tags';
        return this.callApi('DELETE', uri);
    }

    private fetchUsersMe() {
        const uri = this.baseUri + 'ghost/api/v0.1/users/me/?include=roles&status=all';
        return this.callApi('GET', uri);
    }

    private async getAllPosts(): Promise<Post[]> {
        const uri = this.baseUri + 'ghost/api/v0.1/posts/?limit=all';
        const response = await this.callApi('GET', uri);
        const jsonResponse = await response.json();
        return jsonResponse.posts;
    }

    private async tryLoadAuthenticationData() {
        const auth = await Storage.auth.get(AuthenticationDefaultKey);
        if (auth) {
            this.authenticationData = auth;
        }
    }

    private async tryLogin(): Promise<void> {
        const uri = this.baseUri + 'ghost/api/v0.1/authentication/token';

        if (this.authenticationData.authKey == null && this.authenticationData.keyExpiry === 0) {
            await this.tryLoadAuthenticationData();
            if (this.isLoggedIn()) {
                return;
            }
            this.authenticationData.keyExpiry = 0;
        }

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const username = encodeURIComponent(this.loginData.username);
        const password = encodeURIComponent(this.loginData.password);
        const clientId = encodeURIComponent(this.loginData.clientId);
        const clientSecret = encodeURIComponent(this.loginData.clientSecret);
        const formData = `grant_type=password&username=${username}&password=${password}&client_id=${clientId}&client_secret=${clientSecret}`;

        try {
            const response = await this.handleResponseErrors(fetch(uri, {
                method: 'POST',
                headers: headers,
                body: formData,
            }));

            console.log('tryLogin', response);
            const jsonResponse = await response.json();
            this.authenticationData.authKey = jsonResponse.token_type + ' ' + jsonResponse.access_token;
            this.authenticationData.keyExpiry = Date.now() + (jsonResponse.expires_in * 1000) - 1000;
            this.authenticationData.loginState = 'logged-in';

            const meResponse = await this.fetchUsersMe();
            const jsonMeResponse = await meResponse.json();
            this.authenticationData.userId = jsonMeResponse.users[0].id;
            this.authenticationData.gravatarUri =  jsonMeResponse.users[0].image;
            await Storage.auth.set(AuthenticationDefaultKey, this.authenticationData);
        } catch (e) {
            console.log('GhostAPI.tryLogin: ', e);
            throw new Error(e);
        }

    }

    private isLoggedIn() {
        if (this.authenticationData.loginState === 'logged-in' && this.authenticationData.keyExpiry > Date.now()) {
            return true;
        }
        return false;
    }

    private async callApi(method: string, uri: string, body?: FormData | string, contentType?: string): Promise<Response> {
        console.log('callApi', this.isLoggedIn(), method, uri);
        if (!this.isLoggedIn()) {
            await this.tryLogin();
        }

        const headerContentType = contentType ? contentType : 'application/json; charset=UTF-8';
        const headers = {
            'Content-Type': headerContentType,
            'Authorization': this.authenticationData.authKey!,
        };

        if (body) {
            return this.handleResponseErrors(fetch(uri, {
                method: method,
                headers: headers,
                body: body,
            }));
        } else {
            return this.handleResponseErrors(fetch(uri, {
                method: method,
                headers: headers,
            }));
        }
    }
}
