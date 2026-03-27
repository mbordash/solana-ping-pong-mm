declare module "ed25519-hd-key" {
    export function derivePath(
        path: string,
        seed: string | Buffer
    ): { key: Buffer; chainCode: Buffer };
}