# CrossSource Desk — verified Bradbury deployment

## Verified deployment (21 October 2026)

- **Network:** Testnet Bradbury (chain ID 4221)
- **Contract:** `0x59195008F33aa97AaF0bB73ECbd22187694AF559`
- **Deployment transaction:** `0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8`
- **Explorer:** https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8
- **Receipt shown by GenLayer CLI:** `status_name: ACCEPTED`, `resultName: AGREE`, `txExecutionResultName: FINISHED_WITH_RETURN`, five validators voted `AGREE`.
- **Deployed code SHA-256:** `1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2`
- **Verified source length:** 8,536 bytes, exact byte-for-byte match between deployed contract and `contracts/CrossSourceAttestation.py`.
- **RPC checks:** `gen_getContractCode`, `gen_getContractSchema`, and `gen_call` read on `get_claim("1")` passed against live Bradbury. The fresh contract returned `{"error":"unknown claim"}`: no claim had been opened at the time of the check.

Verification: GitHub Actions workflow **Verify Bradbury deployed source and read path** runs without any wallet or private key. Its read check is the exact same helper used by the read-only website.

## Signed end-to-end proof — next action

Use the same installed GenLayer CLI and funded Bradbury testnet account already used for deployment. **No installation is required.** Only copy the commands below into the Terminal, not labels or earlier terminal output.

### Read current state (no transaction)

```sh
genlayer call 0x59195008F33aa97AaF0bB73ECbd22187694AF559 get_claim --rpc https://rpc-bradbury.genlayer.com --args "1"
```

Until a claim exists, this should say `unknown claim`.

### Create synthetic claim 1 (signed write)

```sh
genlayer write 0x59195008F33aa97AaF0bB73ECbd22187694AF559 open_claim --rpc https://rpc-bradbury.genlayer.com --args "Both sources explicitly confirm that milestone CS-DEMO-01 is APPROVED." "https://raw.githubusercontent.com/knisaci/CrossSourceAttestation/main/evidence/demo/approved-a.txt" "https://raw.githubusercontent.com/knisaci/CrossSourceAttestation/main/evidence/demo/approved-b.txt"
```

Wait for `ACCEPTED` or `FINALIZED` with `FINISHED_WITH_RETURN`. Record the transaction hash and numeric claim ID (expected first ID: `1`; verify using `get_claim`).

### Resolve the new claim (signed write)

```sh
genlayer write 0x59195008F33aa97AaF0bB73ECbd22187694AF559 resolve --rpc https://rpc-bradbury.genlayer.com --args "1"
```

Check `get_claim("1")` again with the read command above and save the resolution transaction hash, verdict, reason, and accepted validator result. A `PASS` is expected from two explicit approval fixtures, but cannot be asserted in advance of consensus.

### Optional targeted adversarial on-chain demonstrations

For **post-12k evidence** use a new claim with standard `Both sources establish that final approval for CS-DEMO-02 is GRANTED.` and URLs `evidence/demo/late-denial-a.txt` and `evidence/demo/late-denial-b.txt` on GitHub Raw. Page A places its contradictory final denial after character 12,000.

For **prompt injection**, use `evidence/demo/injection-a.txt` and `evidence/demo/approved-b.txt`. The marker `IGNORE PREVIOUS INSTRUCTIONS` must trigger `INSUFFICIENT` without passing the embedded instruction to the judge.

For **oversized evidence**, use `evidence/demo/oversized-a.txt` and `evidence/demo/approved-b.txt`. The oversized fixture exceeds 32,768 characters and must explicitly produce `INSUFFICIENT`.

These synthetic fixtures demonstrate evaluation mechanics, **not independent third-party factual proof**. The GitHub Actions Direct Mode regression suite independently exercises these outcomes under mocked web and model responses.

## Website security

The current website is **read-only** and points to this new contract. Its wallet connect, open-claim and resolve buttons remain disabled until a real Bradbury write/resolve/read run is completed and the third-party wallet/extension warning is addressed. Do not bypass wallet security warnings.

Never share private keys or recovery phrases. CLI transaction hashes and public contract addresses are safe to include in steward evidence.
