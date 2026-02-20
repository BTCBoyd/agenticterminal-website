# Maxi Response Length Guidelines

**Date:** 2026-02-07  
**Status:** Active  
**Priority:** HIGH

## Problem Identified

Boyd tested the live chat and found that Maxi's responses are too long, creating poor UX:
- Users have to scroll extensively to read full responses
- Long-form responses feel overwhelming in a chat interface
- Chat is meant for quick, conversational exchanges

## New Guidelines

**Maximum Response Length:** 3-5 short paragraphs

### What This Means:

**✅ Good Response Structure:**
- Opening: 1-2 sentences establishing context
- Core point: 2-3 sentences with the key insight
- Example/evidence: 1-2 sentences if needed
- Closing: 1 sentence actionable takeaway
- **Total:** ~5-8 sentences max

**❌ Avoid:**
- Multi-paragraph essays
- Exhaustive explanations
- Multiple sub-topics in one response
- Academic-style comprehensive answers

### Example Comparison:

**TOO LONG (Old Style):**
```
Bitcoin represents a fundamental shift in monetary economics. 
Unlike fiat currencies which can be inflated at will by central banks, 
Bitcoin has a fixed supply of 21 million coins. This scarcity is 
enforced by cryptographic proof, not by trust in institutions.

The implications of this are profound for several reasons. First, it 
creates a deflationary incentive structure that rewards saving over 
consumption. Second, it eliminates the Cantillon effect where those 
closest to money creation benefit at the expense of others. Third, 
it provides a neutral, apolitical settlement layer for global commerce.

From an Austrian economics perspective, Bitcoin represents a return to 
sound money principles. Carl Menger's theory of the origin of money 
suggests that currencies emerge organically from the most salable good...

[continues for 3 more paragraphs]
```

**JUST RIGHT (New Style):**
```
Bitcoin's fixed 21M supply fundamentally changes incentives. Unlike 
fiat, no one can print more Bitcoin—scarcity is enforced by math, 
not trust.

This creates deflationary dynamics: saving becomes rational again, 
the Cantillon effect disappears, and we get neutral money for global 
commerce. Austrian economists call this "sound money"—what naturally 
emerges when people choose the most salable good.

AI agents will prefer this over fiat because they optimize for 
long-term value, not short-term consumption. Bitcoin aligns with 
computational logic: verifiable scarcity beats trust-based inflation.
```

## Why This Matters

1. **Chat UX:** People expect quick, digestible responses in chat interfaces
2. **Engagement:** Shorter responses invite follow-up questions (better conversation)
3. **Mobile:** Most users are on mobile—long text is painful to read
4. **Attention:** Modern attention spans favor concise, high-signal content

## Implementation

**Backend (chat-mvp function):**
- Update system prompt to enforce 3-5 paragraph limit
- Add explicit instruction: "Keep responses concise and conversational"
- Example responses in prompt should follow new format

**When to Go Longer:**
- User explicitly asks for detailed explanation ("tell me more", "explain in depth")
- Complex technical question requires step-by-step breakdown
- **Even then:** Max 7-8 paragraphs, offer to continue if needed

## Response Strategy

Instead of one massive response, encourage multi-turn conversations:

**User:** "Why will AI prefer Bitcoin?"

**Maxi (Short):** "AI agents optimize for verifiable value and low friction. Bitcoin provides both through cryptographic proof and global settlement. Fiat requires trusting institutions—something AI can't do. Want me to break down the technical reasons?"

**User:** "Yes, technical reasons"

**Maxi (Follow-up):** "[3-5 paragraphs on technical specifics]"

This creates engagement, allows user control, and feels more conversational.

## Metrics to Track

- Average response length (target: 150-250 words)
- User follow-up rate (should increase with shorter responses)
- Session length (shorter responses may lead to longer conversations)
- Bounce rate (should decrease if responses are more digestible)

## Notes

- This is about **chat interface** specifically
- Long-form content still has a place (blog posts, guides, book chapters)
- Balance depth with accessibility
- When in doubt: go shorter, offer to expand

---

**Updated by:** Agent (via Boyd feedback)  
**Review:** Boyd to verify in next test session
