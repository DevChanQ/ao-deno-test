import { message } from 'npm:@permaweb/aoconnect'

import { JWKInterface } from './deno-signer/jwk-interface.ts'
import createDataItemSigner from './deno-signer/index.ts'

const process = "HH88jdkVaImwkc5jCfXHHOLK3erDlMc4K-eRHZXLmTo" 
const wallet : JWKInterface = JSON.parse(Deno.env.get("WALLET_JWK") || "")

Deno.serve(async () => {
  // import data to ao via aoconnect
  const message_id = await message({
    process,
    tags: [
      { name: "Action", value: "Testing" }
    ],
    data: "",
    signer: createDataItemSigner(wallet),
  })

  return new Response(
    `Message ID: ${message_id}`,
    { headers: { "Content-Type": "application/json" } },
  )
})