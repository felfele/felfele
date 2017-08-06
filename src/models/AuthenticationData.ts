import { Model } from './Model';

type LoginState = 'logged-in' | 'logged-out';

export interface AuthenticationData extends Model {
    authKey: string | null;
    userId: string | null;
    loginState: LoginState;
    keyExpiry: number;
    gravatarUri: string | null;
}

export const AuthenticationDefaultKey = 'default';

export const AuthenticationDefaultData: AuthenticationData = {
    authKey: null,
    userId: null,
    loginState: 'logged-out',
    keyExpiry: 0,
    gravatarUri: null
}
