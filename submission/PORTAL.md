# GenLayer Portal — Project submission copy

Paste these fields into the Project Explorer application. Character limits are noted.

## 01 Identity

**Project name:** CrossSource Desk

**Primary tag:** Dispute Resolution

If that tag is missing, use **AI & Agents**. Secondary topics if offered: attestation, evidence, milestones.

**Logo:** `submission/logo.svg` (export to PNG at 1024px if the form rejects SVG). Colors: charcoal `#0B0D10`, blue `#7AA2FF`, gold `#E8B86D`.

## 02 One-liner (≤180)

Dual-source evidence gate on GenLayer: lock a standard and two live https pages, then let validators agree only on PASS, FAIL, or INSUFFICIENT.

## 03 Overview (≤1000)

CrossSource Desk is the project form of the accepted CrossSourceAttestation Intelligent Contract on Testnet Bradbury.

A caller locks a natural-language standard plus two distinct public https pages. Anyone can later call resolve(). Every validator fetches both pages live, runs a structured JSON judge, and accepts the leader only when the verdict enum matches. Reasoning text may differ. Equivalence is the verdict field, not byte-identical prose.

That is the trust problem: unstructured web pages cannot be compared with a hash, and a single-model “AI decided X” wrapper is not consensus. The contract is a reusable primitive for grant milestones, listing rules, and agent deliverables.

The public desk is a static app. It connects an injected wallet to Bradbury, submits open_claim and resolve, waits through validator consensus, then reads get_claim from accepted state. The frontend handles the full write lifecycle: fee estimate when available, signature, hash, explorer link, accepted/failed execution, and the resulting claim JSON.

Already proven on-chain: open_claim 0x7f46ff83… and resolve PASS 0x01e47a5b… against example.org and iana.org/domains/reserved.

## 04 Demo video

Optional. If you record one, film:

1. Connect wallet / add Bradbury
2. Load the reserved-domain preset
3. Open claim, show explorer hash
4. Resolve, wait for consensus
5. Show PASS/FAIL/INSUFFICIENT plus reason

Upload to YouTube or an X post and paste the direct URL.

## 05 How-to

**01 · Wallet**
Install MetaMask (or another injected wallet). Add GenLayer Testnet Bradbury, chain id 4221, RPC https://rpc-bradbury.genlayer.com. Get testnet GEN from https://testnet-faucet.genlayer.foundation.

**02 · Open the desk**
Go to https://knisaci.github.io/CrossSourceAttestation/ and click Connect wallet. The app will request the Bradbury chain.

**03 · Open a claim**
Use the “reserved domains (likely PASS)” preset, or write your own standard and two https URLs. Click Open claim. Sign. Wait until the UI shows an opened claim id.

**04 · Resolve**
The claim id is filled in after a successful open. Click Resolve. Sign again. Validators now fetch both pages. This can take several minutes.

**05 · Read the verdict**
When consensus accepts the write, the desk calls get_claim and shows status, verdict, reason, opener, and both locked URLs. You can also paste any existing id (start with `1`) and click Read claim.

## 06 Expected verification outcome (≤500, private)

Steward path: open the GitHub Pages desk → connect a Bradbury wallet with GEN → load the reserved-domain preset (example.org + iana.org/domains/reserved) → Open claim → wait until get_claim shows status OPEN and a numeric id → Resolve → wait until status is RESOLVED and verdict is PASS, FAIL, or INSUFFICIENT. For a faster replay without a new write, Read claim `1` on contract 0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c; that id was resolved PASS in tx 0x01e47a5b666f42a36c0ffa86e5bd2602f0cc6230f6bfda705833382494f27d49. Failure modes to expect: resolve on an already-RESOLVED id reverts; non-https URLs revert; identical URLs revert.

## 07 Links

**Website (required):** https://knisaci.github.io/CrossSourceAttestation/

**GitHub:** https://github.com/knisaci/CrossSourceAttestation

**Contract link 1:** https://explorer-bradbury.genlayer.com/address/0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c

Optional extra evidence:

- https://explorer-bradbury.genlayer.com/tx/0x01e47a5b666f42a36c0ffa86e5bd2602f0cc6230f6bfda705833382494f27d49
- https://explorer-bradbury.genlayer.com/tx/0x7f46ff8380e262b167740385e511666d25f3eb366d43e76b5f0ed97f4951d934
