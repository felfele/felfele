import { GhostAPI } from './GhostAPI';
import { Config } from './Config';
import { Storage } from './Storage';
import { AuthenticationData, AuthenticationDefaultKey, AuthenticationDefaultData } from './models/AuthenticationData';

class _Backend {
    ghostAPI: GhostAPI = new GhostAPI(
        Config.baseUri, 
        Config.loginData, 
        AuthenticationDefaultData,
    );
}

export const Backend = new _Backend();
