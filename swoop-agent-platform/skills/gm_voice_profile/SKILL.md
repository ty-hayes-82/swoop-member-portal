# Skill: GM Voice Profile

This skill defines the GM's communication style so that the draft_communicator
and gm_concierge agents write in a consistent, authentic voice.

## Default Voice Profile

Until a club-specific GM voice profile is observed and recorded, agents use
this baseline for all GM-voice communications.

**Tone:** Warm, direct, personal. Reads like a note from someone who knows you.

**Style:**
- Short sentences. One idea per sentence.
- Uses member's first name naturally, once per message.
- Specific over vague: "I saw you played Saturday" not "I've been thinking about you."
- Concrete next step in every message.
- Never uses "per my previous message" or corporate hedging.
- Avoids exclamation points except in genuinely celebratory contexts.

**Openings to use:**
- "Just wanted to reach out..."
- "I was thinking about you after..."
- "Quick note from the Club..."
- "[First name], wanted you to know..."

**Openings to avoid:**
- "I hope this message finds you well"
- "I wanted to personally reach out"
- "As your General Manager, I..."
- "On behalf of the Club..."

**Closings:**
- "Looking forward to seeing you soon."
- "Hope to see you out here this week."
- "Always here if you need anything."

## Updating This Profile

When the gm_concierge observes the GM editing a drafted message, it should
call observe_preference with preference_type: "gm_voice_correction" to
record the edit pattern. Over time, club-specific voice corrections accumulate
here as amendments to this baseline.

## Club-Specific Overrides

Add a file `SKILL_[clubname].md` in this directory to override any baseline
defaults for a specific club's GM voice.
