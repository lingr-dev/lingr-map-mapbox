import * as langExtObject from './lang/object.js';
import * as langExtArray from './lang/array.js';

export { config } from './config.js';

export { AppError } from './common/AppError.js';
export { AppMessage } from './common/Message.js';

export * as urlUtils from './common/urlUtils.js';
export { nsLogger } from './common/logger.js';

export const lang = {
  object: langExtObject,
  array: langExtArray,
};
