import { createData } from 'npm:warp-arbundles'
import base64url from 'npm:base64url'
import { message } from 'npm:@permaweb/aoconnect'

import { Buffer } from 'node:buffer';
import DenoCryptoDriver, { JWKInterface } from './deno-crypto-driver.ts'

import Signer from "./signer.ts";

const process = "HH88jdkVaImwkc5jCfXHHOLK3erDlMc4K-eRHZXLmTo" 
const wallet : JWKInterface = JSON.parse(Deno.env.get("WALLET_JWK") || "")

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

const createCustomDataItemSigner = (wallet: JWKInterface) => {
  const signer = ({ data, tags, target, anchor } : any) => {
    const signer = new ArweaveSigner(wallet)
    const dataItem = createData(data, signer, { tags, target, anchor })
    return dataItem.sign(signer)
      .then(async () => ({
        id: await dataItem.id,
        raw: await dataItem.getRaw()
      }))
  }

  return signer;
}

Deno.serve(async () => {
  // import data to ao via aoconnect
  const message_id = await message({
    process,
    tags: [
      { name: "Action", value: "Testing" }
    ],
    data: "",
    signer: createCustomDataItemSigner(wallet),
  })

  return new Response(
    `Message ID: ${message_id}`,
    { headers: { "Content-Type": "application/json" } },
  )
})