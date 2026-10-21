# CrossSource Desk — steward remediation evidence

## Reviewed changes (21 October 2026)

The corrected implementation in `contracts/CrossSourceAttestation.py`
was deployed to a new Bradbury contract on 21 October 2026. The previous
contract remains immutable and unchanged. The public website remains
read-only until a fresh open/resolve/read transaction path and wallet
security review are complete.

### Evidence completeness

`_fetch_text` fully evaluates each page up to `MAX_PAGE_CHARS=32768`,
including material after 12,000 characters. Oversized or empty pages return
a reason-coded **INSUFFICIENT** outcome; the contract never evaluates a silently
truncated prefix as though it were complete. This is a deliberately
bounded guarantee, not an unbounded-page reader.

### Untrusted evidence boundary

`_judge` serializes sources as JSON and labels all fetched website material
as **untrusted data**, never instructions. It explicitly tells the judge to
ignore fabricated role assignments, rule changes and verdict overrides.
Direct judge-override patterns are caught before prompting. A PASS must
contain verbatim quotations from both sources, checked against the fetched
text. These protections lower risk; they are not a universal prompt-injection
proof.

### Reproducible verification

Run on Python 3.12:

```sh
python -m pip install 'genlayer-test @ git+https://github.com/genlayerlabs/genlayer-testing-suite.git@343e3a358f9e235a93b49c60721ce7676585ff07' pytest
GENVM_VERSION=v0.2.16 python -m pytest tests/direct/ -v
python -m pytest tests/unit/ -v
python -m py_compile contracts/CrossSourceAttestation.py
sha256sum contracts/CrossSourceAttestation.py
```

The repository CI has two independent jobs:
- **Direct Mode:** seven tests executing actual GenLayer contract methods
  with mocked web and LLM calls, including leader/validator disagreement.
  A test-only SDK compatibility shim adapts the older pinned on-chain
  GenVM layout to the current GenLayer testing suite.
- **Contract-path tests:** seven tests executing the same actual Python
  contract under an isolated mock backend, plus syntax checks.

Coverage: normal quoted PASS; a post-12k material contradiction resulting
in FAIL; oversized-page INSUFFICIENT; webpage instruction injection unable
to force PASS; fabricated quotations unable to force PASS; empty-page
INSUFFICIENT; and independent-validator disagreement.

See GitHub Actions for exact run, source SHA and job results. Tests use mocked
LLM responses; they do not prove adversarial performance against every model.

### Website safeguards

A separate deployed security commit replaces the CDN runtime SDK import with
a locally built GenLayerJS bundle; browser-script origins are restricted to
self; wallet connections and transaction writes are intentionally disabled
until a verified replacement contract is configured. Production dependencies
are audited in frontend CI. A GitHub Pages CSP meta tag cannot supply all
server-only security headers, and the external wallet/extension phishing
classification **has not been confirmed cleared**.

### Deployment evidence: verified on Bradbury

- Contract: `0x59195008F33aa97AaF0bB73ECbd22187694AF559`
- Deployment tx: `0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8`
- GenLayer CLI receipt: **ACCEPTED / AGREE / FINISHED_WITH_RETURN**
- Validator votes: **5 AGREE**
- Source length: **8,536 bytes**
- Local and remote source SHA-256: **`1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2`**
- Live RPC verifies identical deployed source, correct `open_claim`,
  `resolve` and `get_claim` ABI, and a successful read of fresh `get_claim("1")`
  returning `unknown claim` (no claims had been created at check time).
- Live verifier: `.github/workflows/verify-bradbury.yml`, using the same
  browser-compatible read helper deployed by the frontend.
- Deployment transaction explorer:
  https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8

### Remaining on-chain verification and website security

A fresh **signed** `open_claim -> resolve -> get_claim` cycle is still
required; it cannot be replaced with a simulated Direct Mode assertion or
the successful deployment transaction alone. See exact CLI commands and
public synthetic evidence URLs in `docs/BRADBURY-DEPLOYMENT.md`.

The frontend is now pointed to the new Bradbury address for reads, with
wallet actions still disabled. No claim has been made that the external
wallet/extension phishing alert is cleared. Do not override such warnings
or claim that source hardening eliminates every possible prompt-injection.
