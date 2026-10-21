# CrossSource Desk — verified GenLayer Project resubmission (21 October 2026)

**Submission:** `3c571226-e61c-46ca-bfa4-4704b69b171f`  
**State:** updated proof prepared; not submitted in GenLayer Portal by GitHub.

## Project name and tags
- Name: CrossSource Desk
- Primary: Dispute Resolution
- Focus: Evidence Assessment

## One-liner (≤180 chars)

Dual-source evidence gate on GenLayer: lock a standard and two live HTTPS pages, then reach consensus on PASS, FAIL or INSUFFICIENT.

## Project description (≤1000 chars; update from text below)

CrossSource Desk is a GenLayer Intelligent Contract and public read-only evidence viewer on Testnet Bradbury. A caller locks a standard and two distinct HTTPS pages; resolve() fetches both and judges them under validator consensus, comparing PASS, FAIL or INSUFFICIENT rather than narrative text. Pages up to 32,768 characters are evaluated in full; oversized pages yield explicit INSUFFICIENT. Web content is untrusted evidence, never judge instructions. PASS requires verbatim quotations from both sources.

Live contract: 0x59195008F33aa97AaF0bB73ECbd22187694AF559. On-chain claim 1 completed open_claim → resolve → get_claim and stores RESOLVED/PASS (4 AGREE, 1 TIMEOUT). Source bytes match deployment; 7 Direct Mode and 7 additional regression tests pass.

For safety, the public site offers wallet-free claim reads. Signed writes were demonstrated via the GenLayer CLI; website wallet signing remains paused while a reported extension warning is independently reviewed.

## How-to (steward-friendly)

**01. Open the website** — https://knisaci.github.io/CrossSourceAttestation/. It is intentionally wallet-free while the previously reported wallet/extension malicious-site warning is reviewed.

**02. Read proven claim** — Enter `1` and click **Read claim**. The live Bradbury `get_claim` should display `RESOLVED / PASS`, the reason, locked standard, opener and both source URLs.

**03. Check accepted writes** — Inspect on-chain [open_claim](https://explorer-bradbury.genlayer.com/tx/0xdbe326718f9c67980bb9949912cc61fc9f8ea7b1b8b0bdee474336dad2df683e) and [resolve](https://explorer-bradbury.genlayer.com/tx/0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a) receipts, both `FINISHED_WITH_RETURN`. Resolve achieved 4 AGREE and 1 TIMEOUT, with verdict PASS.

**04. Reproduce the evaluation** — Review [Direct Mode and contract-path test runner](https://github.com/knisaci/CrossSourceAttestation/actions) and `docs/STEWARD-REMEDIATION.md`: 7+7 regressions, including post-12k contradiction and prompt injection. The actual adjudication test uses synthetic public evidence.

**05. Signed replay** — See `docs/BRADBURY-DEPLOYMENT.md` for the installed GenLayer CLI and an explicit typed claim ID shim. A wallet is needed only on the operator's trusted local CLI; there is no public-site wallet signing while the warning remains unresolved.

## Expected verification outcome (≤500 chars)

Read claim 1 without a wallet at https://knisaci.github.io/CrossSourceAttestation/. Expect RESOLVED / PASS on 0x59195008F33aa97AaF0bB73ECbd22187694AF559. Accepted open: 0xdbe32671…df683e; accepted resolve: 0x441c3d80…53795a (FINISHED_WITH_RETURN; 4 AGREE, 1 TIMEOUT). Reproduce in README and docs/STEWARD-REMEDIATION.md: source SHA-256 1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2, 14 regression checks. Writes via CLI only while wallet warnings are investigated.

## “What did you change?” (≤1000 chars)

Fixed evidence truncation: pages ≤32,768 chars are fully evaluated; oversized pages yield explicit INSUFFICIENT. Isolated fetched content as untrusted JSON evidence, rejected direct judge-override instructions and unsupported PASS quotations. 7 GenLayer Direct Mode and 7 contract-path tests pass, including evidence after 12,000 chars and injection attempts. New Bradbury contract 0x59195008F33aa97AaF0bB73ECbd22187694AF559: byte-for-byte verified SHA-256 1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2. Claim 1 is RESOLVED/PASS after accepted open 0xdbe32671…df683e and resolve 0x441c3d80…53795a (4 AGREE, 1 TIMEOUT). Site now uses local bundles, restricted CSP, and wallet-free reads. Signing stays disabled pending external warning review. See GitHub docs/STEWARD-REMEDIATION.md and Actions.

## Links / unique supporting evidence

- **Website:** https://knisaci.github.io/CrossSourceAttestation/
- **GitHub:** https://github.com/knisaci/CrossSourceAttestation
- **New deployed contract:** https://explorer-bradbury.genlayer.com/address/0x59195008F33aa97AaF0bB73ECbd22187694AF559
- **Deployment:** https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8
- **Successful open:** https://explorer-bradbury.genlayer.com/tx/0xdbe326718f9c67980bb9949912cc61fc9f8ea7b1b8b0bdee474336dad2df683e
- **Successful resolve:** https://explorer-bradbury.genlayer.com/tx/0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a
- **Steward remediation evidence:** https://github.com/knisaci/CrossSourceAttestation/blob/main/docs/STEWARD-REMEDIATION.md
- **Failure trace and recovery:** https://github.com/knisaci/CrossSourceAttestation/blob/main/docs/BRADBURY-RESOLVE-INCIDENT.md
- **Companion project repo:** https://github.com/knisaci/CrossSourceDesk

**Transparency:** No claim is made that the external wallet/extension threat-provider warning was cleared; no signed adversarial real-network transactions are shown. The public app currently supports read-only claim verification. Only resubmit if the steward accepts that reduced, safer site behavior or after independent reputation clearance and controlled wallet-feature re-enablement.
