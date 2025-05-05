/* eslint-disable */

import { each as _each, entries as _entries } from 'lodash-es';
import debug from 'debug';

const colors = {
  red: {
    terminal: 1,
    rgb: '#ff0000',
  },
  green: {
    terminal: 2,
    rgb: '#00a000',
  },
  yellow: {
    terminal: 3,
    rgb: '#fcae05',
  },
  magenta: {
    terminal: 4,
    rgb: '#ad9aaf',
  },
  blue: {
    terminal: 5,
    rgb: '#004fd8',
  },
  gray: {
    terminal: 7,
    rgb: '#777777',
  },
};

const levels = {
  cfg: {
    color: colors.blue,
    suffix: 'CFG',
  },
  dbg: {
    color: colors.magenta,
    suffix: 'DBG',
  },
  log: {
    color: colors.gray,
    suffix: 'LOG',
  },
  info: {
    color: colors.green,
    suffix: 'INF',
  },
  warn: {
    color: colors.yellow,
    suffix: 'WRN',
  },
  error: {
    color: colors.red,
    suffix: 'ERR',
  },
};

class NamespaceLogger {
  handlers: { [key: string]: any };

  constructor() {}

  _log(level) {}
}

export const nsLogger = {
  init(namespaceList: string[]): void {
    const namespaces = namespaceList.join(',');

    debug.enable(namespaces);
  },

  create(namespace: string): void {
    _each(
      _entries(levels, ([lvlName, lvlInfo]) => {
        Object.defineProperty(this, lvlName, {
          get() {},
        });
      })
    );
  },
};
