# Bolt Performance Journal

## 2025-05-15 - Throttling high-frequency scroll events
**Learning:** Multiple components in the codebase were listening to the `scroll` event and performing expensive operations (like `getBoundingClientRect` and state updates) on every single tick. This can lead to significant main-thread jank, especially on lower-end devices or when many components are active simultaneously. Throttling these listeners to an appropriate frequency (~16ms for parallax effects and ~100ms for UI state updates) provides a balance between responsiveness and performance.

**Action:** Always check for unthrottled/undebounced event listeners on high-frequency events like `scroll`, `resize`, and `mousemove`. Use a utility like `throttle` to limit the execution rate and ensure smoother performance.
