# CrossSourceAttestation

Standalone GenLayer Intelligent Contract.

A caller locks a natural-language standard plus two independent https evidence URLs. `resolve` has validators fetch both pages live, run a structured JSON judge, and accept the leader only when the verdict enum matches: `PASS | FAIL | INSUFFICIENT`. Reasoning text may differ.

This is a reusable primitive for milestones, listing rules, and agent deliverables. It is not a frontend and not a thin LLM wrapper.

## Why consensus

The pages are unstructured HTML. Byte-identical LLM output is the wrong equivalence rule. Validators independently re-derive the verdict field via `gl.vm.run_nondet_unsafe`.

## Calls

1. `open_claim(standard, url_a, url_b)` → claim id
2. `resolve(id)` → consensus verdict
3. `get_claim(id)` → JSON state

Demo pages: `https://example.org` and `https://www.iana.org/domains/reserved`.
