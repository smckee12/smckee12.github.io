# New Change 2: Unified Portfolio Header

## Status
Implemented on `NewChange2` — awaiting review; not pushed or merged.

## Goal
Replace the two overlapping navigation bars with one integrated header that combines the horizontal portfolio navigation, my initials, and the contrast toggle.

## Why
After adding the horizontal layout, the original page toolbar and the new section navigation both appear at the top and perform essentially the same job. One unified navigation bar will remove that duplication.

## Proposed changes
- Remove the original page-link toolbar as a separate navigation bar.
- Move the horizontal section navigation up into the top header to replace it.
- Keep my initials and the contrast toggle at the top, integrated with the new navigation bar.
- Provide one set of links for Home, About, Work Experience, and Contact, with a clear indication of the active section.
- Retain the previous/next controls and horizontal-navigation guidance without creating another duplicate set of section links.
- Update the horizontal layout's initialization and active-state handling to use the unified navigation.
- Adjust responsive spacing and panel-height calculations for the consolidated header.
- Preserve working direct-page links and navigation when JavaScript is disabled.

## Scope
### Included
- Top header structure and section navigation.
- Placement of the existing initials and contrast toggle within the unified header.
- Responsive header behavior on desktop and mobile.
- Navigation event handling, active-section indicators, keyboard focus, and panel-height adjustments needed for this change.

### Not included
- Changes to portfolio copy, imagery, section order, or content.
- Changes to the approved Section snap behavior.
- Changes to the approved baseline in `PLAN.md`.
- New portfolio sections or unrelated features.
- Merging into `main` or publishing without separate approval.

## Acceptance criteria
- Only one set of main section-navigation links appears at the top.
- The horizontal navigation replaces the original page toolbar rather than appearing beneath it as a duplicate.
- My initials and the contrast toggle remain visible and usable in the integrated top header.
- Visitors can still reach all four main sections through the navigation and previous/next controls.
- The active-section indicator, browser history, direct routes, and keyboard navigation continue to work.
- Keyboard users can see focus and operate navigation and the contrast toggle without a focus trap.
- The header remains readable and usable at desktop and mobile widths without clipped or overlapping controls.
- The horizontal panels still fit beneath the header, and long sections remain fully readable.
- Without JavaScript, visitors retain one usable set of page-navigation links and readable page content.

## Evaluation
- Check the unified header at desktop, 375px mobile, and 320px mobile widths.
- Navigate between all four sections using header links, previous/next controls, keyboard input, and horizontal gestures.
- Confirm active indicators, browser back/forward behavior, and direct section URLs.
- Test the contrast toggle before and after section navigation, including persistence after reloading.
- Confirm that no duplicate section-link navigation or contrast toggle is rendered.
- Recheck long-section scrolling, loading-failure recovery, and the no-JavaScript page fallback.

### Verification
- Checked the unified header at 1280px, 375px, and 320px widths with one navigation list, one initials link, and one contrast toggle.
- Browser checks passed for section links, previous/next controls, keyboard focus, history, horizontal wheel scrolling, emulated touch, long-section access, and theme persistence across navigation and reload.
- Loading-failure recovery and no-JavaScript regression checks passed across all four main sections. The Jekyll build and JavaScript syntax checks passed.

## Risks
- The horizontal script currently reads section information from the original `.nav-list` and creates a second navigation bar. Removing that source without adapting initialization could disable horizontal navigation.
- Consolidating the header changes its height; stale sizing assumptions could reduce the visible panel area or clip content.
- Responsive spacing must keep the initials, section links, and contrast toggle accessible without reintroducing duplicate navigation.

## Open questions
- None currently. The requested direction is one integrated top header with the horizontal navigation, initials, and contrast toggle.
