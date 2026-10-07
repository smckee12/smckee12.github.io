# New Change 1: Horizontal Portfolio Layout

## Status
Proposed — prototype the interaction before choosing the final behavior.

## Goal
Replace the portfolio’s primarily vertical navigation with a left-to-right scrolling experience.

## Why
I want visitors to move through the portfolio sideways instead of scrolling down a long page.

## Proposed changes
- Arrange Home, About, Work Experience, and Contact as horizontally navigable panels.
- Try one-panel-at-a-time scrolling with section snapping.
- Support trackpad, touch, keyboard, and visible previous/next controls.
- Show which panel is active and how to reach the others.
- Keep text readable and content reachable on desktop and mobile.

## Scope
### Included
- Main portfolio layout and navigation.
- Responsive behavior for horizontal panels.
- A prototype to evaluate section snapping.

### Not included
- Changes to portfolio copy, imagery, or content unless needed for the new layout.
- Changes to the approved baseline in `PLAN.md`.

## Acceptance criteria
- Visitors can reach every main section by navigating horizontally.
- The active section and available navigation are clear.
- Keyboard users can move between sections and see where focus is.
- Content remains readable and isn’t clipped at mobile or desktop widths.
- The snap behavior feels predictable rather than trapping or jerking the visitor between sections.

## Evaluation
- Test section snapping with a trackpad, touch, keyboard, and navigation controls.
- If snapping feels clunky, compare it with softer snapping or continuous horizontal scrolling.
- Choose the behavior that feels easiest to navigate.

## Risks
- Horizontal navigation may be unfamiliar, so provide clear cues and controls.
- Long sections may not fit in one viewport; avoid clipping content.

## Open questions
- Which horizontal-scroll behavior feels best after testing: one-section-at-a-time snap, softer snap, or continuous scrolling?
