// Read-only forensic trace of the failed first resolve transaction.
// Exact hash from Bradbury receipt. This does not sign or submit transactions.
import {readClaimFromBradbury} from "../src/bradbury-read.js";
const RPC="https://rpc-bradbury.genlayer.com";
const TX="0x9ecee457ddfa70a20312c2bd49b035203ddf66a381889699e69f94de92502d62";
const ADDRESS="0x59195008F33aa97AaF0bB73ECbd22187694AF559";
async function call(method,params) {
  const response=await fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(45000)});
  const j=await response.json();
  if(j.error)throw Error(method+" "+JSON.stringify(j.error));
  return j.result;
}
for(const [method,params] of [
  ["gen_getTransactionReceipt",[{txId:TX}]],
  ["gen_dbg_traceTransaction",[{txID:TX,round:0}]]
]){
  try{
    const r=await call(method,params);
    console.log("RPC_METHOD",method);
    if(method==="gen_getTransactionReceipt"){
      console.log("RECEIPT",JSON.stringify(r,(_,v)=>typeof v==="bigint"?String(v):v).slice(0,10000));
    }else{
      console.log("TRACE_RESULT_CODE",r?.result_code);
      console.log("TRACE_STDERR",JSON.stringify(r?.stderr||"").slice(0,14000));
      console.log("TRACE_STDOUT",JSON.stringify(r?.stdout||"").slice(0,5000));
      console.log("TRACE_RETURN_DATA",JSON.stringify(r?.return_data||"").slice(0,3000));
      console.log("TRACE_VM_LOG",JSON.stringify(r?.genvm_log||r?.logs||[]).slice(0,25000));
      console.log("TRACE_EQ_OUTPUTS",JSON.stringify(r?.eq_outputs||[]).slice(0,8000));
    }
  }catch(e){console.log("RPC_QUERY_ERROR",method,String(e));}
}
try{
  console.log("CLAIM1_NOW",await readClaimFromBradbury("1",ADDRESS,RPC));
}catch(e){console.log("CLAIM_READ_ERROR",String(e));}
