import { Model } from './Model';

export interface LoginData extends Model {
    username: string;
    password: string;
    clientId; string;
    clientSecret: string;
}
