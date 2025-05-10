import { createHandle } from './handleUtils.js';

function wrap(global: typeof globalThis) {
  return {
    setTimeout: (rawFn: globalThis.TimerHandler, timeout: number) => {
      const timer = global.setTimeout(rawFn, timeout);
      return createHandle(() => global.clearTimeout(timer));
    },
  };
}

const clock = wrap(globalThis);

export { clock, wrap };
