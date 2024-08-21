import { createData } from 'npm:warp-arbundles'
import { message } from 'npm:@permaweb/aoconnect'

import { JWKInterface } from './jwk-interface.ts'
import ArweaveSigner from "./signer.ts";

const process = "HH88jdkVaImwkc5jCfXHHOLK3erDlMc4K-eRHZXLmTo" 
const wallet : JWKInterface = JSON.parse(Deno.env.get("WALLET_JWK") || "")

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