/**
 * Limits the execution of a function to once every 'limit' milliseconds.
 * This version ensures that the function is called at most once per limit,
 * and also handles the trailing edge to ensure the final state is captured.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      if (lastFunc) clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - (lastRan as number) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
          lastFunc = null;
        }
      }, limit - (Date.now() - (lastRan as number)));
    }
  };
}
