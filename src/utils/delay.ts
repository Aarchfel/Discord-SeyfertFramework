// Usage: Sleep(time in ms OR use delayDefaultTime);
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const delayDefaultTime = 1000;
