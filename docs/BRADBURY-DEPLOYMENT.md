# CrossSource Desk — controlled Bradbury deployment

**Security rule:** only deploy reviewed code after the two regression CI
jobs pass on the exact same SHA. An earlier deployed contract is NOT patched
by a GitHub commit.

## 1. On your own Mac, with the GenLayer CLI

Run from a clean clone of this repo on the verified commit:

```sh
npm install -g genlayer
genlayer network set testnet-bradbury
genlayer network info
genlayer account
genlayer deploy --contract contracts/CrossSourceAttestation.py --rpc https://rpc-bradbury.genlayer.com
```

Use an **existing funded testnet account** in the local GenLayer CLI keychain.
The CLI prompts locally for the signer. Never put a private key, seed phrase,
keystore or wallet recovery phrase into ChatGPT, the repository or GitHub Actions.

Deployment on the Bradbury chain requires signing and paying transaction fees;
neither GitHub commits nor an ordinary read-only RPC can perform it.

## 2. Verify the actual deployed bytecode and behavior

Record the deployment transaction, new contract address and source commit.
Wait for accepted/finalized execution and check that it actually succeeded.
Then use the CLI against the NEW address:

```sh
genlayer call NEW_ADDRESS get_claim --rpc https://rpc-bradbury.genlayer.com --args 1
```

To create a fresh claim, use `genlayer write NEW_ADDRESS open_claim` with
a full criterion and two trusted public https pages. Read its numeric ID
and resolve THAT ID with `genlayer write NEW_ADDRESS resolve --args ID`.
Do not assume ID=1 unless this is a fresh deployment.

For a complete steward demonstration, preserve three separate controlled
transactions: a clear PASS, one source with a late contradiction after 12,000
characters (FAIL), and one oversized/injected source (INSUFFICIENT).
A mock-backed Direct Mode pass does not prove public network execution.

## 3. Re-enable wallet actions only after verification

The deployed website deliberately defaults to read-only mode. Do not change
`VITE_WRITES_ENABLED` to true or configure a replacement address until the new
contract, correct chain ID (4221), and website reputation have been verified.
When activating the new address, inspect the generated site and wallet requests
before asking external reviewers to connect.

## 4. Steward evidence

Submit exact GitHub commit, green GitHub Actions jobs, test counts, source
SHA-256, deployment address and transaction URLs. The prior on-chain PASS
example belongs to the old (unfixed) contract and is not regression evidence.
