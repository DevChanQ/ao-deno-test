// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createData } from 'npm:warp-arbundles'
import base64url from 'npm:base64url'
import { message } from 'npm:@permaweb/aoconnect'

import { Buffer } from 'node:buffer';
import WebCryptoDriver from './webcrypto-driver.ts'
import type { JWKInterface } from './webcrypto-driver.ts'

import Signer from "./signer.ts";

const process = "18o_3lcvLH2SoYD3phOOJS3yDNfjU_R4e-zuJcK7m3E" 
const wallet : JWKInterface = JSON.parse(Deno.env.get("WALLET_JWK") || "")

const webCryptoDriver = new WebCryptoDriver()

export default class ArweaveSigner implements Signer {
  webCryptoDriver: WebCryptoDriver;
  readonly signatureType: number = 1;
  readonly ownerLength: number = 512;
  readonly signatureLength: number = 512;
  protected jwk: JWKInterface;
  public pk: string;

  constructor(jwk: JWKInterface) {
    this.pk = jwk.n;
    this.jwk = jwk;
    this.webCryptoDriver = new WebCryptoDriver()
  }

  get publicKey(): Buffer {
    return base64url.toBuffer(this.pk);
  }

  sign(message: Uint8Array): Uint8Array {
    return webCryptoDriver.sign(this.jwk, message) as any;
  }

  static async verify(pk: string, message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return await webCryptoDriver.verify(pk, message, signature);
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
  await message({
    process,
    tags: [
      { name: "Action", value: "Testing" }
    ],
    data: "",
    signer: createCustomDataItemSigner(wallet),
  })

  return new Response(
    "Success",
    { headers: { "Content-Type": "application/json" } },
  )
})