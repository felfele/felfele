export type BrandedType<T, N>  = T & { __tag__: N };
export type BrandedString<N> = BrandedType<string, N>;

export type FlavoredType<T, N>  = T & { __tag__?: N };

export type HexString = BrandedString<'HexString'>;
