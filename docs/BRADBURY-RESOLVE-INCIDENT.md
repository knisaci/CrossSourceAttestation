# Bradbury resolve failure — transaction forensic record

**Date:** 21 October 2026  
**Contract (old/current on-chain):** `0x59195008F33aa97AaF0bB73ECbd22187694AF559`  
**Failed resolve transaction:** https://explorer-bradbury.genlayer.com/tx/0x9ecee457ddfa70a20312c2bd49b035203ddf66a381889699e69f94de92502d62

## Actual outcome

- `status_name: ACCEPTED` means the chain decided on the transaction.
- `txExecutionResultName: FINISHED_WITH_ERROR` means the contract **did not succeed**.
- Five validators voted **DISAGREE**; this is not PASS / FAIL / INSUFFICIENT.
- `get_claim("1")` still showed `OPEN`, with no verdict, after the transaction.

## Exact root cause (reproduced from Bradbury trace)

Read-only RPC: `gen_dbg_traceTransaction` with
`{"txID":"0x9ecee457ddfa70a20312c2bd49b035203ddf66a381889699e69f94de92502d62","round":0}`.

```text
result_code: 2
File "/contract.py", line 152, in resolve
  if claim_id not in self.claims:
File ".../tree_map.py", line 420, in _get_fn
  if k < _Node.key:
TypeError: '<' not supported between instances of 'int' and 'str'
```

The installed GenLayer CLI's `--args "1"` passes calldata as an INTEGER.
The contract's `TreeMap[str, Claim]` holds IDs as STRING keys.
The public method's Python annotation `claim_id: str` did not coerce the
incoming calldata. This failed before any evidence was fetched or any
LLM was called, confirmed by the trace counters: **0 web and 0 LLM calls**.

The currently deployed contract cannot be modified by pushing GitHub code.
**Do not retry the same `resolve --args "1"` against that address.**
Replaying will fail at the same deterministic entry-point bug.

## Corrected candidate

At the public boundaries of both `resolve` and `get_claim`:

```python
claim_id = str(claim_id)
```

This retains string-key storage but accepts the actual CLI integer calldata.
The new regression tests send the integer `1` through both real Direct Mode
and the contract-method harness. Eight scenarios per suite pass.

## Release gate

1. Deploy the corrected branch to a NEW Bradbury address with the authorised
   CLI signer. Do not merge changed on-chain source into `main` beforehand,
   because the current live source/ABI CI validates the existing deployed SHA.
2. Verify the new byte-for-byte source and ABI from live Bradbury.
3. Open a fresh claim on that deployment, then resolve with CLI `--args "1"`.
4. Verify the accepted result says `FINISHED_WITH_RETURN`, and `get_claim`
   reports `RESOLVED` plus a verdict; not simply `status_name: ACCEPTED`.
5. Update website, both repos, portal and evidence with new contract/tx hashes.
   Wallet controls must stay disabled until the malicious-site report clears.
