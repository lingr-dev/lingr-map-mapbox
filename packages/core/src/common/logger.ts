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

export class NamespaceLogger {
  handlers: { [key: string]: any };
  namespace: string;
  instance: debug.Debugger;

  constructor(namespace: string) {
    this.handlers = {};
    this.namespace = namespace;

    this.instance = debug(namespace);
  }

  get cfg() {
    if (this.handlers['cfg']) {
      return this.handlers['cfg'];
    }

    const handler = this.instance.extend(levels.cfg.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.cfg.color.rgb;

    this.handlers['cfg'] = handler;

    return this.handlers['cfg'];
  }

  get dbg() {
    if (this.handlers['dbg']) {
      return this.handlers['dbg'];
    }

    const handler = this.instance.extend(levels.dbg.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.dbg.color.rgb;

    this.handlers['dbg'] = handler;

    return this.handlers['dbg'];
  }

  get log() {
    if (this.handlers['log']) {
      return this.handlers['log'];
    }

    const handler = this.instance.extend(levels.log.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.log.color.rgb;

    this.handlers['log'] = handler;

    return this.handlers['log'];
  }

  get info() {
    if (this.handlers['info']) {
      return this.handlers['info'];
    }

    const handler = this.instance.extend(levels.info.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.info.color.rgb;

    this.handlers['info'] = handler;

    return this.handlers['info'];
  }

  get warn() {
    if (this.handlers['warn']) {
      return this.handlers['warn'];
    }

    const handler = this.instance.extend(levels.warn.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.warn.color.rgb;

    this.handlers['warn'] = handler;

    return this.handlers['warn'];
  }

  get error() {
    if (this.handlers['error']) {
      return this.handlers['error'];
    }

    const handler = this.instance.extend(levels.error.suffix);
    handler.log = console.log.bind(console);
    handler.color = levels.error.color.rgb;

    this.handlers['error'] = handler;

    return this.handlers['error'];
  }
}

export const nsLogger = {
  _loggers: new Map<string, NamespaceLogger>(),

  init(namespaceList: string[]): void {
    const namespaces = namespaceList.join(',');

    debug.enable(namespaces);
  },

  create(namespace: string): NamespaceLogger {
    if (this._loggers.has(namespace)) {
      return this._loggers.get(namespace) as NamespaceLogger;
    }

    const instance = new NamespaceLogger(namespace);

    return instance;
  },
};
