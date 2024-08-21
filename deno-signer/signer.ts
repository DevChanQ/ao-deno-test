import { Buffer } from 'node:buffer';

import { Tag, DataItem } from 'npm:warp-arbundles'
import base64url from 'npm:base64url'

import { JWKInterface } from './jwk-interface.ts';
import DenoCryptoDriver from './deno-crypto-driver.ts';

abstract class Signer {
  readonly signer?: any;
  readonly publicKey: Buffer;
  readonly signatureType: number;
  readonly signatureLength: number;
  readonly ownerLength: number;
  readonly pem?: string | Buffer;

  abstract sign(message: Uint8Array, _opts?: any): Promise<Uint8Array> | Uint8Array;
  abstract signDataItem?(dataItem: string | Buffer, tags: Tag[]): Promise<DataItem>;
  abstract setPublicKey?(): Promise<void>;
  abstract getAddress?(): Promise<string>;
  static verify(_pk: string | Buffer, _message: Uint8Array, _signature: Uint8Array, _opts?: any): boolean {
    throw new Error('You must implement verify method on child');
  }
}

export default class ArweaveSigner implements Signer {
  readonly signatureType: number = 1;
  readonly ownerLength: number = 512;
  readonly signatureLength: number = 512;
  protected jwk: JWKInterface;
  public pk: string;
  webCryptoDriver: DenoCryptoDriver;

  constructor(jwk: JWKInterface) {
    this.pk = jwk.n;
    this.jwk = jwk;
    this.webCryptoDriver = new DenoCryptoDriver()
  }

  get publicKey(): Buffer {
    return base64url.toBuffer(this.pk);
  }

  sign(message: Uint8Array): Uint8Array {
    return this.webCryptoDriver.sign(this.jwk, message) as any;
  }

  static async verify(pk: string, message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return await this.webCryptoDriver.verify(pk, message, signature);
  }
}
