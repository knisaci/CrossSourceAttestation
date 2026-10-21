// Read-only, account-free verification of CrossSource Desk's Bradbury deployment.
// Verifies deployed source byte-for-byte against the committed Python contract.
// Performs a real node-backed read, but never constructs or signs a transaction.
import fs from "node:fs";
import crypto from "node:crypto";
import { toRlp, toHex } from "viem";

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

// Exercise an account-free, read-only call using documented GenLayer
// calldata encoding. No private key and no transaction submission.
function uleb(num) {
  let n = BigInt(num);
  const out = [];
  do {
    let b = Number(n & 127n);
    n >>= 7n;
    if (n !== 0n) b |= 128;
    out.push(b);
  } while(n);
  return out;
}
function encodeValue(v) {
  if (typeof v === "string") {
    const bytes = Buffer.from(v,"utf8");
    return Buffer.concat([Buffer.from(uleb((BigInt(bytes.length)<<3n)|4n)),bytes]);
  }
  if(Array.isArray(v)){
    return Buffer.concat([Buffer.from(uleb((BigInt(v.length)<<3n)|5n)),...v.map(encodeValue)]);
  }
  if(v && typeof v === "object"){
    const entries = Object.entries(v).sort(([a],[b])=>a.localeCompare(b,"en"));
    const parts = [Buffer.from(uleb((BigInt(entries.length)<<3n)|6n))];
    for (const [key,value] of entries){
      const bytes=Buffer.from(key,"utf8");
      parts.push(Buffer.from(uleb(bytes.length)),bytes,encodeValue(value));
    }
    return Buffer.concat(parts);
  }
  throw new Error("unsupported read calldata type");
}
function decodeValue(bytes) {
  let pos=0;
  function getNum(){
    let shift=0n, out=0n;
    for (;;) {
      if(pos>=bytes.length)throw new Error("truncated return calldata");
      const b=BigInt(bytes[pos++]);
      out |= (b&127n)<<shift;
      if(b<128n)return out;
      shift+=7n;
    }
  }
  function parse(){
    const n=getNum();
    const kind=Number(n&7n), size=Number(n>>3n);
    if(kind===4){
      const ret=bytes.subarray(pos,pos+size).toString("utf8");pos+=size;return ret;
    }
    if(kind===1)return n>>3n;
    if(kind===0){if(n===0n)return null;if(n===8n)return false;if(n===16n)return true;}
    if(kind===5){const arr=[];for(let k=0;k<size;k++)arr.push(parse());return arr;}
    if(kind===6){
      const obj={};for(let k=0;k<size;k++){
        const length=Number(getNum());const key=bytes.subarray(pos,pos+length).toString("utf8");pos+=length;
        obj[key]=parse();
      }return obj;
    }
    throw new Error("unhandled calldata kind "+kind);
  }
  return parse();
}
const call = await rpcCall("gen_call", [{
  from:"0x4e8F33FfDddd993fD8aC945897C54c3c1C73664a",
  to:ADDRESS,
  type:"read",
  value:"0x0",
  status:"accepted",
  data:toRlp([toHex(encodeValue({method:"get_claim",args:["1"]})), toHex(false)]),
}]);
if (call.status?.code !== 0) {
  throw new Error("get_claim(1) failed: "+JSON.stringify(call.status));
}
const returned = Buffer.from(String(call.data||"").replace(/^0x/,""),"hex");
if (!returned.length) throw new Error("Read call returned empty data");
const decoded = decodeValue(returned);
const val = typeof decoded==="string" ? JSON.parse(decoded) : decoded;
if(!val || typeof val!=="object")throw new Error("unexpected claim result: "+JSON.stringify(decoded));
if(val.error==="unknown claim") {
 console.log("PASS: get_claim(1) returned unknown claim for new contract");
}else if(val.id==="1") {
 console.log("PASS: get_claim(1) returned:",val.status,val.verdict);
}else {
 throw new Error("Unexpected get_claim(1) result: "+JSON.stringify(val));
}
console.log("READ_ONLY_BRADBURY_VERIFICATION_SUCCESS");
