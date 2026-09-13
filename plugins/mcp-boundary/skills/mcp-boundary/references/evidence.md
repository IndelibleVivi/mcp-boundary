# Evidence and completion claims

Verification begins with a claim, not a preferred test suite.

## Claim matrix

| Claim | Minimum relevant observer |
| --- | --- |
| Manifest declares a capability | Static manifest inspection |
| Active handler implements it | Source trace plus a focused executable check |
| Wire behavior matches a revision | Transport/protocol observation against the selected profile |
| External effect occurred | Downstream system observation with effect identity |
| Resource renders locally | Local runtime or browser observation |
| Resource works in a named host | Observation in that exact host and relevant version |
| Owner accepts a product tradeoff | Explicit owner decision |

A stronger-looking surrogate does not replace the required observer. A weaker but direct observation may be more useful than broad indirect coverage.

## Outcome vocabulary

- **Verified**: the selected evidence supports this exact claim.
- **Contradicted**: the selected evidence shows this exact claim is false.
- **Not verified**: available evidence does not settle the claim.
- **Not applicable**: the condition is outside the actual architecture or requested contract.

Always attach the label to a named claim and scope. “Verified locally” and “verified in the named host” are different statements.

## Proportionate verification

Choose fresh checks that could reject the material failure introduced by the change. Useful combinations include:

- schema/manifest checks plus package-tree comparison for packaging changes;
- unit checks plus an effect-order assertion for tool handlers;
- protocol fixtures plus an actual transport exchange for wire changes;
- local render checks plus a named-host run when host compatibility is claimed;
- retained-caller and retired-entrypoint searches for migrations.

Do not run unrelated audits to manufacture confidence. Report environmental limits and skipped observers plainly.
