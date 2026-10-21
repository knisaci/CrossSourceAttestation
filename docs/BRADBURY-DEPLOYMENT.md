# CrossSource Desk — verified Bradbury deployment

## Verified deployment (21 October 2026)

- **Network:** Testnet Bradbury (chain ID 4221)
- **Contract:** `0x59195008F33aa97AaF0bB73ECbd22187694AF559`
- **Deployment transaction:** `0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8`
- **Explorer:** https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8
- **Receipt shown by GenLayer CLI:** `status_name: ACCEPTED`, `resultName: AGREE`, `txExecutionResultName: FINISHED_WITH_RETURN`, five validators voted `AGREE`.
- **Deployed code SHA-256:** `1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2`
- **Verified source length:** 8,536 bytes, exact byte-for-byte match between deployed contract and `contracts/CrossSourceAttestation.py`.
- **RPC checks:** `gen_getContractCode`, `gen_getContractSchema`, and `gen_call` read on `get_claim("1")` passed against live Bradbury. The fresh contract returned `{"error":"unknown claim"}` at deployment verification time, before the first claim.

Verification: GitHub Actions workflow **Verify Bradbury deployed source and read path** runs without any wallet or private key. Its read check is the exact same helper used by the read-only website.

## Signed end-to-end demonstration — RESOLVED / PASS

Use the same installed GenLayer CLI and funded Bradbury testnet account already used for deployment. **No installation is required.** Only copy the commands below into the Terminal, not labels or earlier terminal output.

### Read durable claim state (no transaction)

```sh
node --import ./scripts/typed-cli-string-loader.mjs "$(command -v genlayer)" call 0x59195008F33aa97AaF0bB73ECbd22187694AF559 get_claim --rpc https://rpc-bradbury.genlayer.com --args str#1
```

For claim 1, expect `RESOLVED` and `PASS` after the accepted resolve receipt.

### Signed open_claim transaction — completed

```sh
genlayer write 0x59195008F33aa97AaF0bB73ECbd22187694AF559 open_claim --rpc https://rpc-bradbury.genlayer.com --args "Both sources explicitly confirm that milestone CS-DEMO-01 is APPROVED." "https://raw.githubusercontent.com/knisaci/CrossSourceAttestation/main/evidence/demo/approved-a.txt" "https://raw.githubusercontent.com/knisaci/CrossSourceAttestation/main/evidence/demo/approved-b.txt"
```

**Verified CLI receipt (21 October 2026):** accepted and executed successfully.

- Transaction: [`0xdbe326718f9c67980bb9949912cc61fc9f8ea7b1b8b0bdee474336dad2df683e`](https://explorer-bradbury.genlayer.com/tx/0xdbe326718f9c67980bb9949912cc61fc9f8ea7b1b8b0bdee474336dad2df683e)
- Sender: `0x4e8F33FfDddd993fD8aC945897C54c3c1C73664a`
- Contract: `0x59195008F33aa97AaF0bB73ECbd22187694AF559`
- Status: **ACCEPTED**, consensus **AGREE** from **five validators**, execution **FINISHED_WITH_RETURN**.
- First claim ID should be `1`; independently verify through live `get_claim("1")`.
- Criterion: `Both sources explicitly confirm that milestone CS-DEMO-01 is APPROVED.`
- Locked evidence: `evidence/demo/approved-a.txt` and `approved-b.txt` via GitHub Raw URLs.

### Successful resolve (signed write — completed)

The official GenLayer CLI coerced a bare digit argument into an integer. A first
attempt using `--args "1"` failed with `FINISHED_WITH_ERROR` and four other
validators agreeing on the same runtime error. The underlying exception was a
TreeMap string-versus-integer comparison, **not** a verdict disagreement.
The failed transaction is [`0x9ecee457…02d62`](https://explorer-bradbury.genlayer.com/tx/0x9ecee457ddfa70a20312c2bd49b035203ddf66a381889699e69f94de92502d62).
See [transaction forensic report](BRADBURY-RESOLVE-INCIDENT.md).

The recovery used a Node 24 in-memory type adapter, which sends `str#1`
as the literal string claim ID `"1"`. The read-only command first verified
that claim 1 was `OPEN`.

```sh
node --import ./scripts/typed-cli-string-loader.mjs "$(command -v genlayer)" write 0x59195008F33aa97AaF0bB73ECbd22187694AF559 resolve --rpc https://rpc-bradbury.genlayer.com --args str#1
```

**Actual receipt (21 October 2026):**

- **Resolve tx:** [`0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a`](https://explorer-bradbury.genlayer.com/tx/0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a)
- **Consensus status:** `ACCEPTED`; `resultName: AGREE`.
- **Execution:** `FINISHED_WITH_RETURN` (execution result `1`).
- **Validator votes:** `AGREE, AGREE, AGREE, TIMEOUT, AGREE` — 4 AGREE, 1 TIMEOUT.
- **Consensus output:** verdict `PASS`; reason: `Both sources explicitly state that milestone CS-DEMO-01 is approved.`.
- **Expected durable state:** `get_claim("1")` reports `status=RESOLVED`, `verdict=PASS`.

The CI live-RPC verifier checks that durable state, contract bytes and both
static-site read helpers, and independently checks the resolve transaction's
execution status. The test fixtures are synthetic; this proves the GenLayer
decision pipeline, not any unrelated real-world milestone.

### Optional targeted adversarial on-chain demonstrations

For **post-12k evidence** use a new claim with standard `Both sources establish that final approval for CS-DEMO-02 is GRANTED.` and URLs `evidence/demo/late-denial-a.txt` and `evidence/demo/late-denial-b.txt` on GitHub Raw. Page A places its contradictory final denial after character 12,000.

For **prompt injection**, use `evidence/demo/injection-a.txt` and `evidence/demo/approved-b.txt`. The marker `IGNORE PREVIOUS INSTRUCTIONS` must trigger `INSUFFICIENT` without passing the embedded instruction to the judge.

For **oversized evidence**, use `evidence/demo/oversized-a.txt` and `evidence/demo/approved-b.txt`. The oversized fixture exceeds 32,768 characters and must explicitly produce `INSUFFICIENT`.

These synthetic fixtures demonstrate evaluation mechanics, **not independent third-party factual proof**. The GitHub Actions Direct Mode regression suite independently exercises these outcomes under mocked web and model responses.

## Website security

The current website is **read-only** and points to this new contract. Its wallet connect, open-claim and resolve buttons remain disabled until a real Bradbury write/resolve/read run is completed and the third-party wallet/extension warning is addressed. Do not bypass wallet security warnings.

Never share private keys or recovery phrases. CLI transaction hashes and public contract addresses are safe to include in steward evidence.
