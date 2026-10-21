// Account-free Bradbury RPC reader. The RPC accepts a two-element RLP
// transaction-call payload, not bare calldata. No wallet access anywhere.
// Local, dependency-free RLP encoding for the two-element GenLayer read call.
function fromHex(hex){const h=String(hex).replace(/^0x/,"");
  if(h.length%2||!/^[0-9a-fA-F]*$/.test(h))throw Error("Invalid hex");
  return Uint8Array.from(h.match(/.{2}/g)||[],x=>parseInt(x,16));}
function toHex(bytes){if(bytes===false)return "0x00";
  return "0x"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}
function beLen(n){let x=n,out=[];while(x){out.unshift(x&255);x=Math.floor(x/256);}return Uint8Array.from(out);}
function rlpBytes(a){
  if(a.length===1&&a[0]<0x80)return a;
  if(a.length<=55)return join(Uint8Array.of(128+a.length),a);
  const n=beLen(a.length);return join(Uint8Array.of(183+n.length),n,a);}
function toRlp(values){
  const payload=join(...values.map(v=>rlpBytes(fromHex(v))));
  if(payload.length<=55)return "0x"+Array.from(join(Uint8Array.of(192+payload.length),payload),b=>b.toString(16).padStart(2,"0")).join("");
  const n=beLen(payload.length);
  return toHex(join(Uint8Array.of(247+n.length),n,payload));}

const utf8 = new TextEncoder();
const decoder = new TextDecoder();
const uleb = (value) => {
  let n=BigInt(value); const out=[];
  do {let b=Number(n & 127n);n >>= 7n;if(n)b|=128;out.push(b);}while(n);
  return Uint8Array.from(out);
};
const join = (...parts) => {
  const length=parts.reduce((n,x)=>n+x.length,0);
  const ret=new Uint8Array(length);let i=0;
  for(const p of parts){ret.set(p,i);i+=p.length;}return ret;
};
function encode(data){
  if(typeof data==="string"){
    const b=utf8.encode(data);
    return join(uleb((BigInt(b.length)<<3n)|4n), b);
  }
  if(Array.isArray(data)){
    return join(uleb((BigInt(data.length)<<3n)|5n),...data.map(encode));
  }
  if(data && typeof data==="object" && Object.getPrototypeOf(data)===Object.prototype){
    const entries=Object.entries(data).sort(([a],[b])=>a<b?-1:a>b?1:0);
    const parts=[uleb((BigInt(entries.length)<<3n)|6n)];
    for(const [k,v] of entries){const key=utf8.encode(k);parts.push(uleb(key.length),key,encode(v));}
    return join(...parts);
  }
  throw new TypeError("Unsupported claim-call argument type");
}
function decode(buf){
  let pos=0;
  function readNum(){
    let shift=0n,n=0n;
    for(;;){if(pos>=buf.length)throw new Error("Truncated GenLayer response");
      const b=BigInt(buf[pos++]);n|=(b&127n)<<shift;
      if(b<128n)return n;shift+=7n;
      if(shift>70n)throw new Error("Invalid GenLayer varint");
    }
  }
  function parse(){
    const n=readNum(),type=Number(n&7n),size=Number(n>>3n);
    if(type===4){if(pos+size>buf.length)throw Error("Truncated string");
      const s=decoder.decode(buf.subarray(pos,pos+size));pos+=size;return s;}
    if(type===1)return n>>3n;
    if(type===0){if(n===0n)return null;if(n===8n)return false;if(n===16n)return true;}
    if(type===5){const arr=[];for(let i=0;i<size;i++)arr.push(parse());return arr;}
    if(type===6){const obj={};for(let i=0;i<size;i++){
      const len=Number(readNum());if(pos+len>buf.length)throw Error("Truncated map key");
      const key=decoder.decode(buf.subarray(pos,pos+len));pos+=len;
      if(Object.prototype.hasOwnProperty.call(obj,key))throw Error("Duplicate key");
      obj[key]=parse();}return obj;}
    throw Error("Unexpected calldata type "+type);
  }
  const value=parse();if(pos!==buf.length)throw Error("Excess bytes in claim response");
  return value;
}
export async function readClaimFromBradbury(claimId, address, rpc){
  const id=String(claimId??"").trim();
  if(!/^\d+$/.test(id))throw Error("Enter a numeric claim ID.");
  const payload=toRlp([toHex(encode({method:"get_claim",args:[id]})),toHex(false)]);
  const request={jsonrpc:"2.0",method:"gen_call",
    params:[{from:"0x0000000000000000000000000000000000000000",
      to:address,type:"read",value:"0x0",status:"accepted",data:payload}],id:1};
  const response=await fetch(rpc,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(request),signal:AbortSignal.timeout(30000),
  });
  if(!response.ok)throw Error("Bradbury RPC HTTP "+response.status);
  const json=await response.json();
  if(json.error)throw Error("Bradbury read failed: "+json.error.message);
  if(json.result?.status?.code!==0)throw Error("GenVM read error: "+(json.result?.status?.message||"unknown"));
  const returned=json.result.data;
  const hex=typeof returned==="string" && !returned.startsWith("0x") ? "0x"+returned : returned;
  if(typeof hex!=="string" || !/^0x[0-9a-fA-F]+$/.test(hex))
    throw Error("Unexpected GenLayer return data: "+String(returned).slice(0,80));
  const value=decode(fromHex(hex,"bytes"));
  if(typeof value!=="string")throw Error("get_claim returned a non-string value");
  return value;
}

if(typeof document!=="undefined"){
  const btn=document.getElementById("read-claim");
  const field=document.getElementById("claim-id");
  const out=document.getElementById("claim-result");
  btn?.addEventListener("click",async()=>{
    out.textContent="Reading Bradbury...";
    try{
      const raw=await readClaimFromBradbury(field.value,
        "0x59195008F33aa97AaF0bB73ECbd22187694AF559",
        "https://rpc-bradbury.genlayer.com");
      out.textContent=JSON.stringify(JSON.parse(raw),null,2);
    }catch(e){out.textContent="Read failed: "+String(e?.message||e);}
  });
}
