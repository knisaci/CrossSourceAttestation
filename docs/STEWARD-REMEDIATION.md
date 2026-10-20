# CrossSource Desk — steward remediation evidence

## Reviewed changes (21 October 2026)

The code in `contracts/CrossSourceAttestation.py` is the new evaluation
implementation. The original Bradbury contract is immutable and has NOT
yet been replaced. The public site remains in read-only mode until the
corrected contract is deployed and wallet warnings are reviewed.

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

### Deployment evidence still required

A new Bradbury deployment using the fixed source is required, with transaction
hash, contract address, a genuine `open_claim -> resolve -> get_claim` run and
a second adversarial real-network check. Do not cite the old PASS tx as proof
that the new code is deployed. See `docs/BRADBURY-DEPLOYMENT.md`.
