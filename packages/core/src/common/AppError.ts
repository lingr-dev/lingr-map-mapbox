/* eslint-disable */

import { clone } from '../lang/object.js';
import { AppMessage } from '../common/Message.js';
// import { nsLogger } from './logger.js'

export class AppError extends AppMessage {
  static fromJSON(json: { name: string; message: string; details: any }): AppError {
    return new AppError(json.name, json.message, json.details);
  }

  constructor(name: string, messageTemplate: string | undefined, details?: any) {
    super(name, messageTemplate, details);
  }

  toJSON(): { name: string; message: string; details: any } {
    //  const logger = Logger.getLogger("esri.core.Error");
    // const logger = nsLogger.create("lingr.core.AppError");

    if (this.details !== null && this.details !== undefined) {
      try {
        return {
          name: this.name,
          message: this.message,
          details: JSON.parse(
            JSON.stringify(this.details, (_key, value) => {
              if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                return value;
              }
              try {
                return clone(value);
              } catch (error) {
                return '[object]';
              }
            })
          ),
        };
      } catch (error) {
        // logger.error(error);
        throw error;
      }
    }

    return { name: this.name, message: this.message, details: this.details };
  }
}

// AppError.prototype.type = 'error'
