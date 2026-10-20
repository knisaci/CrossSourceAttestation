# Steward remediation – 21 October 2026

This is proposed source in a review branch, NOT a deployed or security-cleared application.

## Logic
- A fetched page of up to 32,768 characters is evaluated in full. Larger pages yield explicit INSUFFICIENT, not a truncated verdict. Empty pages also abstain.
- JSON evidence is explicitly marked untrusted and cannot redefine the locked standard or judge instructions.
- Direct judge-override patterns yield INSUFFICIENT; this tripwire alone does not defeat all prompt injections.
- A PASS requires verbatim quotations independently present in both sources. These checks are necessary, not proof of semantic correctness.
- Direct Mode regression tests exercise open_claim -> resolve -> get_claim, long-page late contradiction, oversized pages, a malicious judge-override instruction, fabricated PASS quotes, empty pages, and validator disagreement.

## Verify
Install Python 3.12+ and run:
```sh
python -m pip install genlayer-test pytest
python -m pytest tests/direct/ -v
```
The workflow runs the same suite. Mocked Direct Mode results are not live-model or multi-validator proof.

## Wallet/site safety
The current frontend uses EIP-1193 requests and genlayer-js at esm.sh. Source review found no seed phrase capture or arbitrary payment recipient in checked app files, but the served site, external SDK and reputation warning have NOT been independently cleared. Do not bypass warnings or sign through a flagged site. The new CSP in the HTML limits resource origins but is not a substitute for server HTTP security headers or supply-chain verification. Record the wallet brand, warning screenshot and flagged exact URL and request manual review from its blocklist provider after independently verifying served code.

## Deployment requirement
The site currently targets 0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c on Bradbury. That contract remains the old implementation: GitHub edits do not modify deployed contract bytecode. After CI passes, deploy corrected source to a NEW address, verify the actual Bradbury resolve/read flow and update app/portal/explorer links. Do not cite the previous PASS transaction as evidence of a fix.
