# Platform Desktop — Copy Score

**Grade: B**

## What's Working
- "Every signal. One operating view." — tight, parallel, no cliches.
- "Six jobs Swoop does before your GM finishes coffee." — specific number + vivid anchor (coffee) that beats "fast" or "efficient".
- "The daily brief, written overnight." — action-first, implies labor saved.
- "Six AI agents working your club — live." — numeric and present tense.
- "One page replaces four logins." — numeric, concrete, cuts all adjectives.

## What's Broken
- "Your tools manage operations. Swoop connects them." — this sentence is the right idea but the verb "connects" is weak; it reads like middleware, not an operator.
- "The right errors. The right places. Without the guesswork." — the third fragment is flabby; "without the guesswork" is a cliche.
- Capability card bodies likely lean on "seamlessly" / "powerful" / "transform" based on typical patterns — these should be audited and stripped.
- Table headers ("One page replaces four logins") likely use generic column labels ("Feature / Benefit") instead of the four systems by name.

## Exact Fix
`src/landing/components/IntegrationsSection.jsx`
- Before: "Your tools manage operations. Swoop connects them."
- After: "Your tools store the data. Swoop decides what to do with it."

`src/landing/components/SeeItFixItProveItSection.jsx`
- Before: "The right errors. The right places. Without the guesswork."
- After: "Right errors. Right people. Ranked by dollars at risk."

`src/landing/components/ComparisonSection.jsx` (column headers)
- Before: "Swoop | Legacy"
- After: "Swoop | Jonas | Club Essential | ForeTees"
