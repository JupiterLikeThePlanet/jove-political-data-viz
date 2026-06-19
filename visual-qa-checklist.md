# Visual QA Checklist

Use this checklist after every generated component is wired into the
test harness and rendering in the browser. Do not mark a component
"done" until every applicable item passes human visual review.

This checklist is for human judgment — no automated test covers all of it.

---

## All Components

### Data
- [ ] Data is rendering — not empty, not all zeros, not all the same value
- [ ] Numbers are correctly formatted (percentages show %, margins show +/-)
- [ ] Candidate names are spelled correctly and cased consistently
- [ ] Data source is indicated somewhere visible or in tooltip

### Color
- [ ] Democratic blue (#2563eb) and Republican red (#dc2626) are visually distinct
- [ ] Color alone is not the only differentiator — labels, patterns, or text also present
- [ ] Colorblind-safe palette renders correctly when passed as theme prop
- [ ] Colors are legible on both light and dark backgrounds if both are used

### Typography
- [ ] All text is readable at normal viewing distance
- [ ] No text is clipped, overflowing, or hidden behind other elements
- [ ] Axis labels, tick marks, and legends are present and correct
- [ ] Font size is appropriate — not too small to read, not so large it crowds the chart

### Layout
- [ ] Component fills its container correctly
- [ ] Responsive — resize the browser window, nothing breaks or disappears
- [ ] No elements overlap unexpectedly at any viewport width
- [ ] Margins and padding feel balanced — nothing is cramped or floating

### Interaction
- [ ] Hover tooltip appears on hover
- [ ] Tooltip is positioned near the cursor, not off-screen or behind the element
- [ ] Tooltip text is correct and formatted cleanly
- [ ] Keyboard focus is visible on interactive elements (Tab through the component)
- [ ] Keyboard Enter/Space triggers the same action as click where applicable

### Loading and Error States
- [ ] Loading state renders — does it look intentional or broken?
- [ ] Error state renders — is the message clear and non-technical?
- [ ] Empty/no-data state renders — is it obvious what's missing and why?

---

## Maps Specifically

### Geographic Accuracy
- [ ] All 50 states are visible and in the correct position
- [ ] Alaska and Hawaii are shown — not cropped out
- [ ] State boundaries look correct — no obviously distorted shapes
- [ ] AlbersUsa projection is being used (correct for national US maps)

### Color Scale
- [ ] Win margin gradient is readable — landslide states clearly more saturated
  than close states (if using margin-based coloring, not just winner-take-all)
- [ ] Uncalled/no-data states are a neutral color (not accidentally red or blue)
- [ ] Legend accurately describes the color scale shown

### Tooltip
- [ ] Appears on state hover with state name and **all candidates'**
  percentages (not just the winner) and the margin — a user comparing
  states needs to see how close the losing side was, not only who won
- [ ] Disappears cleanly when mouse leaves the state
- [ ] Does not overlap neighboring states or get clipped at map edges

### Reference Comparison
- [ ] Pull up a real reference (NYT, Reuters, FiveThirtyEight) and compare directly
- [ ] Does the output look like something that could appear in a newsroom context?
- [ ] If not — what specifically is different? Log it in iteration-log.md

---

## Charts Specifically

### Bar Charts
- [ ] Bars are sorted in a meaningful order (by value, or by candidate name consistently)
- [ ] Y axis starts at 0 unless there is a documented reason not to
- [ ] Bar labels or value annotations are present and readable
- [ ] Bars have sufficient width — not so narrow they're hard to click or read

### Line Charts
- [ ] Lines are visually distinct — different colors, not just different dashes
- [ ] Data points are visible (dots on the line) for sparse data
- [ ] Trend direction is readable at a glance — slope is perceptible
- [ ] X axis date formatting is clean — no overlapping tick labels

### Reference Comparison
- [ ] FiveThirtyEight polling trend: scatter dots + smooth aggregate line
- [ ] NYT results: clean color, clear winner annotation, no chart junk
- [ ] Does the output match the standard? Log gaps in iteration-log.md

---

## After Checklist Passes

Once a component passes all applicable items:

1. Take a Playwright screenshot snapshot as the visual baseline
2. Add the working prompt to Section 4 test cases in SKILL.md
3. Add a one-line entry to iteration-log.md marking it done
4. Copy the final component into references/examples/ if it's a new type
