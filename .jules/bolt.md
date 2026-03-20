## 2025-05-15 - [Throttling Scroll Listeners]
**Learning:** High-frequency event listeners (like 'scroll') can cause unnecessary re-renders and CPU usage if not throttled. In this codebase, the Header, PropertyStickyNav, and ScrollToTop components all relied on unthrottled scroll events.
**Action:** Use the `throttle` utility from `src/lib/utils.ts` for any window-level event listeners that trigger state updates.
