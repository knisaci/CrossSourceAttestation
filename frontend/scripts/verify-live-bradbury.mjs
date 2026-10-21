// Read-only, account-free verification of CrossSource Desk's Bradbury deployment.
// Verifies deployed source byte-for-byte against the committed Python contract.
// Performs a real node-backed read, but never constructs or signs a transaction.
import fs from "node:fs";
import crypto from "node:crypto";
import {readClaimFromBradbury} from "../src/bradbury-read.js";

const ADDRESS = "0x59195008F33aa97AaF0bB73ECbd22187694AF559";
const RPC = "https://rpc-bradbury.genlayer.com";
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function rpcCall(method, params) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jsonrpc:"2.0", method, params, id: 1}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status} for ${method}`);
  const json = await response.json();
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  if (json.result === undefined || json.result === null)
    throw new Error(`${method}: unexpected or empty result`);
  return json.result;
}

const original = fs.readFileSync(new URL("../../contracts/CrossSourceAttestation.py", import.meta.url));
const encoded = await rpcCall("gen_getContractCode", [{address: ADDRESS, status: "accepted"}]);
const onchain = Buffer.from(encoded, "base64");
if (!onchain.length) throw new Error("No on-chain source returned");
const expectedSHA = hash(original);
const observedSHA = hash(onchain);
console.log("Address:", ADDRESS);
console.log("Local source bytes:", original.length, "SHA-256:", expectedSHA);
console.log("On-chain source bytes:", onchain.length, "SHA-256:", observedSHA);
if (!onchain.equals(original)) {
  let mismatch = 0;
  while (mismatch < Math.min(onchain.length, original.length) &&
         onchain[mismatch] === original[mismatch]) mismatch++;
  throw new Error(`On-chain source mismatch, first different byte ${mismatch}; NOT VERIFIED`);
}
console.log("PASS: Bradbury deployed contract source matches repository byte-for-byte");

const schema = await rpcCall("gen_getContractSchema", [{code: encoded}]);
for (const method of ["open_claim","resolve","get_claim"]) {
  if (!schema.methods?.[method])
    throw new Error(`Contract ABI does not expose ${method}`);
}
console.log("PASS: deployed ABI exposes open_claim, resolve and get_claim");

// Check the EXACT read helper used in the published browser frontend.
const raw = await readClaimFromBradbury("1", ADDRESS, RPC);
const val = JSON.parse(raw);
if (val.error === "unknown claim") {
  console.log("PASS: get_claim(1) returned unknown claim for new contract");
} else if (val.id === "1") {
  console.log("PASS: get_claim(1) returned:", val.status, val.verdict);
} else {
  throw new Error("Unexpected get_claim(1) result: " + raw);
}
console.log("READ_ONLY_BRADBURY_VERIFICATION_SUCCESS");
