// Read-only, account-free verification of CrossSource Desk's Bradbury deployment.
// Verifies deployed source byte-for-byte against the committed Python contract.
// Performs a real node-backed read, but never constructs or signs a transaction.
import fs from "node:fs";
import crypto from "node:crypto";
import {readClaimFromBradbury} from "../src/bradbury-read.js";
import {readClaimFromBradbury as readLegacySiteClaim} from "../../docs/read-only.js";

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
if (val.id !== "1")
  throw new Error("Expected claim ID 1 after the accepted open_claim transaction: " + raw);
if (val.standard !== "Both sources explicitly confirm that milestone CS-DEMO-01 is APPROVED.")
  throw new Error("Unexpected claim standard: " + val.standard);
for (const suffix of ["approved-a.txt", "approved-b.txt"]) {
  const field = suffix.includes("-a.") ? "url_a" : "url_b";
  if (val[field] !== "https://raw.githubusercontent.com/knisaci/CrossSourceAttestation/main/evidence/demo/" + suffix)
    throw new Error("Unexpected evidence URL for " + field + ": " + val[field]);
}
if (val.status !== "RESOLVED" || val.verdict !== "PASS")
  throw new Error("Claim 1 is not finalized RESOLVED/PASS: " + JSON.stringify(val));
if (!val.reason?.includes("Both sources explicitly state"))
  throw new Error("Expected decision reason missing: " + JSON.stringify(val));
if (val.resolved_by?.toLowerCase() !== "0x4e8f33ffdddd993fd8ac945897c54c3c1c73664a")
  throw new Error("Unexpected resolving account: " + val.resolved_by);
console.log("PASS: on-chain signed claim 1 exists with exact locked standard and two fixture URLs");
console.log("Claim 1 current status:", val.status, "verdict:", val.verdict || "(not resolved)");
// Verify the signed write was executed, not merely marked accepted.
const RESOLVE_TX="0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a";
const receipt=await rpcCall("gen_getTransactionReceipt",[{txId:RESOLVE_TX}]);
if(Number(receipt.status)!==5 || Number(receipt.txExecutionResult)!==1 ||
   Number(receipt.result)!==1)
  throw new Error("Resolve transaction not accepted/executed successfully: "+JSON.stringify(receipt));
const round=receipt.roundData?.[0];
if(!round || Number(round.votesRevealed)!==5 || !round.validatorResultHash?.length)
  throw new Error("Missing validator consensus receipt data");
console.log("PASS: resolve tx was ACCEPTED and FINISHED_WITH_RETURN",
  RESOLVE_TX, "votes revealed", round.votesRevealed);
const oldSiteRead=await readLegacySiteClaim("1",ADDRESS,RPC);
if(JSON.stringify(JSON.parse(oldSiteRead))!==JSON.stringify(val))
  throw new Error("Branch-Pages read-only viewer disagrees with bundled frontend");
console.log("PASS: both static Pages publishers can read the same live claim");
console.log("READ_ONLY_BRADBURY_VERIFICATION_SUCCESS");
