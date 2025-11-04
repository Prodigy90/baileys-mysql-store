declare module "libsignal" {
  export const curve: {
    generateKeyPair(): {
      pubKey: Uint8Array;
      privKey: Uint8Array;
    };
    calculateSignature(privateKey: any, message: Uint8Array): Uint8Array;
  };
}

