# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
CrossSourceAttestation
----------------------
Reusable Intelligent Contract primitive.

A caller locks a natural-language standard plus two independent public
evidence URLs. Later, anyone can resolve the claim. Validators each fetch
both pages, extract only decision-bearing facts, and accept the leader
only when the verdict enum matches.

This is not "AI decides X". The LLM is constrained to:
  PASS | FAIL | INSUFFICIENT
and validators independently re-derive that enum from live pages.

Use cases that remain useful after the demo:
  - grant / bounty milestone check against two public artifacts
  - listing or policy compliance against a rules page + a listing page
  - agent deliverable check against a spec URL + a PR / commit URL
"""

from genlayer import *
from dataclasses import dataclass
import json


ALLOWED_VERDICTS = ("PASS", "FAIL", "INSUFFICIENT")


@allow_storage
@dataclass
class Claim:
    opener: Address
    standard: str
    url_a: str
    url_b: str
    status: str  # OPEN | RESOLVED
    verdict: str
    reason: str
    resolved_by: Address


class Contract(gl.Contract):
    claims: TreeMap[str, Claim]
    next_id: u256

    def __init__(self):
        self.claims = TreeMap()
        self.next_id = u256(1)

    def _require_https(self, url: str) -> None:
        if not url.startswith("https://"):
            raise Exception("evidence URL must be https")
        if len(url) < 12 or len(url) > 512:
            raise Exception("evidence URL length invalid")

    def _require_distinct(self, a: str, b: str) -> None:
        if a.rstrip("/") == b.rstrip("/"):
            raise Exception("evidence URLs must be distinct pages")

    @gl.public.write
    def open_claim(self, standard: str, url_a: str, url_b: str) -> str:
        if len(standard.strip()) < 16:
            raise Exception("standard must be a real criterion, not a stub")
        if len(standard) > 2000:
            raise Exception("standard too long")
        self._require_https(url_a)
        self._require_https(url_b)
        self._require_distinct(url_a, url_b)

        claim_id = str(int(self.next_id))
        self.next_id = self.next_id + u256(1)
        self.claims[claim_id] = Claim(
            opener=gl.message.sender_address,
            standard=standard.strip(),
            url_a=url_a.strip(),
            url_b=url_b.strip(),
            status="OPEN",
            verdict="",
            reason="",
            resolved_by=Address("0x" + "00" * 20),
        )
        return claim_id

    def _fetch_text(self, url: str) -> str:
        page = gl.nondet.web.get(url)
        body = page.body.decode("utf-8", errors="replace") if hasattr(page, "body") else str(page)
        return body[:12000]

    def _judge(self, standard: str, text_a: str, text_b: str, url_a: str, url_b: str) -> dict:
        prompt = f"""
You are an evidence adjudicator for an on-chain claim.

STANDARD (locked, do not invent extra rules):
{standard}

SOURCE A URL: {url_a}
SOURCE A TEXT:
{text_a}

SOURCE B URL: {url_b}
SOURCE B TEXT:
{text_b}

Return JSON only:
{{
  \"verdict\": \"PASS\" | \"FAIL\" | \"INSUFFICIENT\",
  \"reason\": \"one short sentence citing only facts present in the sources\"
}}

Rules:
- PASS only if BOTH sources together satisfy the standard.
- FAIL if the sources clearly contradict the standard.
- INSUFFICIENT if a page is missing, empty, unrelated, or too ambiguous.
- Do not use knowledge outside these two pages.
"""
        raw = gl.nondet.exec_prompt(prompt, response_format="json")
        if isinstance(raw, str):
            raw = json.loads(raw)
        verdict = str(raw.get("verdict", "INSUFFICIENT")).upper()
        if verdict not in ALLOWED_VERDICTS:
            verdict = "INSUFFICIENT"
        reason = str(raw.get("reason", ""))[:400]
        return {"verdict": verdict, "reason": reason}

    @gl.public.write
    def resolve(self, claim_id: str) -> str:
        if claim_id not in self.claims:
            raise Exception("unknown claim")
        claim = self.claims[claim_id]
        if claim.status != "OPEN":
            raise Exception("claim already resolved")

        standard = claim.standard
        url_a = claim.url_a
        url_b = claim.url_b

        def leader_fn():
            text_a = self._fetch_text(url_a)
            text_b = self._fetch_text(url_b)
            return self._judge(standard, text_a, text_b, url_a, url_b)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                mine = leader_fn()
                theirs = leader_result.calldata
                if isinstance(theirs, str):
                    theirs = json.loads(theirs)
                return mine["verdict"] == theirs.get("verdict")
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        if isinstance(result, str):
            result = json.loads(result)

        claim.status = "RESOLVED"
        claim.verdict = str(result.get("verdict", "INSUFFICIENT"))
        claim.reason = str(result.get("reason", ""))[:400]
        claim.resolved_by = gl.message.sender_address
        self.claims[claim_id] = claim
        return claim.verdict

    @gl.public.view
    def get_claim(self, claim_id: str) -> str:
        if claim_id not in self.claims:
            return json.dumps({"error": "unknown claim"})
        c = self.claims[claim_id]
        return json.dumps(
            {
                "id": claim_id,
                "opener": str(c.opener),
                "standard": c.standard,
                "url_a": c.url_a,
                "url_b": c.url_b,
                "status": c.status,
                "verdict": c.verdict,
                "reason": c.reason,
                "resolved_by": str(c.resolved_by),
            }
        )
