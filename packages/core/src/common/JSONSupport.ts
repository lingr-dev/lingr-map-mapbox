/* eslint-disable */

export function isSerializable(r: any) {
  return r && 'object' === typeof r && 'toJSON' in r && 'function' === typeof r.toJSON;
}
