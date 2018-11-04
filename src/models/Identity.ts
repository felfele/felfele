export interface PublicIdentity {
    publicKey: string;
    address: string;
}

export interface PrivateIdentity extends PublicIdentity {
    privateKey: string;
}
