/* eslint-disable */

import { equals as arrayEquals } from './array.js';

type PlainObject = { [key: string]: any };

/**
 * 修复 JSON 对象，删除值为 undefined 的属性
 * @param obj 要修复的对象
 * @param deep 是否深度修复
 * @returns 修复后的对象
 */
function fixJson(obj: PlainObject, deep: boolean = false): PlainObject {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (deep && typeof obj[key] === 'object' && obj[key] !== null) {
        fixJson(obj[key], true);
      }
    }
  }
  return obj;
}

/**
 * 检查对象是否有 clone 方法
 * @param obj 要检查的对象
 * @returns 如果有 clone 方法返回 true，否则返回 false
 */
function isClonable(obj: any): boolean {
  return typeof obj.clone === 'function';
}

/**
 * 检查对象是否有 map 和 forEach 方法
 * @param obj 要检查的对象
 * @returns 如果有 map 和 forEach 方法返回 true，否则返回 false
 */
function isMappable(obj: any): boolean {
  return typeof obj.map === 'function' && typeof obj.forEach === 'function';
}

/**
 * 检查对象是否有 notifyChange 和 watch 方法
 * @param obj 要检查的对象
 * @returns 如果有 notifyChange 和 watch 方法返回 true，否则返回 false
 */
function isAccessorLike(obj: any): boolean {
  return typeof obj.notifyChange === 'function' && typeof obj.watch === 'function';
}

/**
 * 检查对象是否为普通对象
 * @param obj 要检查的对象
 * @returns 如果是普通对象返回 true，否则返回 false
 */
function isPlainObject(obj: any): boolean {
  if (Object.prototype.toString.call(obj) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(obj);
  return prototype === null || prototype === Object.prototype;
}

/**
 * 递归克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
function clone(obj: any): any {
  if (!obj || typeof obj !== 'object' || typeof obj === 'function') return obj;

  const specialClone = handleSpecialCloning(obj);
  if (specialClone !== null) return specialClone;

  if (isClonable(obj)) return obj.clone();
  if (isMappable(obj)) return obj.map(clone);
  if (isAccessorLike(obj)) return obj.clone();

  const newObj: PlainObject = {};
  for (const key of Object.getOwnPropertyNames(obj)) {
    newObj[key] = clone(obj[key]);
  }
  return newObj;
}

/**
 * 处理特殊类型的克隆
 * @param obj 要克隆的对象
 * @returns 克隆后的对象，如果不支持克隆则返回 null
 */
function handleSpecialCloning(obj: any): any {
  // if (isInt8Array(obj) || isUint8Array(obj) || isUint8ClampedArray(obj) ||
  //     isInt16Array(obj) || isUint16Array(obj) || isInt32Array(obj) ||
  //     isUint32Array(obj) || isFloat32Array(obj) || isFloat64Array(obj)) {
  //     return obj.slice();
  // }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof ArrayBuffer) {
    return obj.slice(0, obj.byteLength);
  }
  if (obj instanceof Map) {
    const newMap = new Map();
    for (const [key, value] of obj) {
      newMap.set(key, clone(value));
    }
    return newMap;
  }
  if (obj instanceof Set) {
    const newSet = new Set();
    for (const value of obj) {
      newSet.add(clone(value));
    }
    return newSet;
  }
  return null;
}

/**
 * 尝试克隆对象，如果克隆失败返回 null
 * @param obj 要克隆的对象
 * @returns 克隆后的对象，如果克隆失败返回 null
 */
function tryClone(obj: any): any {
  if (
    !obj ||
    typeof obj !== 'object' ||
    typeof obj === 'function' ||
    (typeof globalThis !== 'undefined' && 'HTMLElement' in globalThis && obj instanceof HTMLElement)
  ) {
    return obj;
  }

  const specialClone = handleSpecialCloning(obj);
  if (specialClone !== null) return specialClone;

  if (isMappable(obj)) {
    let allCloned = true;
    const newArray = obj.map((item: any) => {
      const clonedItem = tryClone(item);
      if (item !== null && clonedItem === null) {
        allCloned = false;
      }
      return clonedItem;
    });
    return allCloned ? newArray : null;
  }

  if (isClonable(obj)) return obj.clone();
  if (obj instanceof File || obj instanceof Blob) return obj;

  if (!isAccessorLike(obj)) {
    const newObj = new (Object.getPrototypeOf(obj).constructor)();
    for (const key of Object.getOwnPropertyNames(obj)) {
      const value = obj[key];
      const clonedValue = tryClone(value);
      if (value !== null && clonedValue === null) return null;
      newObj[key] = clonedValue;
    }
    return newObj;
  }

  return null;
}

/**
 * 检查两个值是否相等，支持 NaN 和 Date 对象
 * @param a 第一个值
 * @param b 第二个值
 * @returns 如果相等返回 true，否则返回 false
 */
function equals(a: any, b: any): boolean {
  return (
    a === b ||
    (typeof a === 'number' && isNaN(a) && typeof b === 'number' && isNaN(b)) ||
    (typeof a?.getTime === 'function' && typeof b?.getTime === 'function' && a.getTime() === b.getTime())
  );
}

/**
 * 浅比较两个值是否相等
 * @param a 第一个值
 * @param b 第二个值
 * @returns 如果相等返回 true，否则返回 false
 */
function equalsShallow(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || typeof a === 'string') return a === b;
  if (typeof a === 'number') return a === b || (typeof b === 'number' && isNaN(a) && isNaN(b));
  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime();
  if (Array.isArray(a)) return Array.isArray(b) && arrayEquals(a, b);
  if (a instanceof Set) return b instanceof Set && setsAreEqual(a, b);
  if (a instanceof Map) return b instanceof Map && mapsAreEqual(a, b);
  if (isPlainObject(a)) return isPlainObject(b) && objectsAreEqual(a, b);
  return false;
}

/**
 * 检查两个对象是否相等
 * @param a 第一个对象
 * @param b 第二个对象
 * @returns 如果相等返回 true，否则返回 false
 */
function objectsAreEqual(a: PlainObject, b: PlainObject): boolean {
  if (a === null || b === null) return false;
  const keysA = Object.keys(a);
  if (Object.keys(b).length !== keysA.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key] || !b.hasOwnProperty(key)) return false;
  }
  return true;
}

/**
 * 检查两个 Set 是否相等
 * @param a 第一个 Set
 * @param b 第二个 Set
 * @returns 如果相等返回 true，否则返回 false
 */
function setsAreEqual(a: Set<any>, b: Set<any>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

/**
 * 检查两个 Map 是否相等
 * @param a 第一个 Map
 * @param b 第二个 Map
 * @returns 如果相等返回 true，否则返回 false
 */
function mapsAreEqual(a: Map<any, any>, b: Map<any, any>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    const bValue = b.get(key);
    if (bValue !== value || (bValue === undefined && !b.has(key))) return false;
  }
  return true;
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @param mergeArrays 是否合并数组
 * @returns 合并后的对象
 */
function deepMerge(target: PlainObject | undefined, source: PlainObject, mergeArrays: boolean = false): PlainObject {
  return mergeObjects(target, source, mergeArrays);
}

/**
 * 获取对象的深层值
 * @param path 属性路径
 * @param obj 目标对象
 * @returns 属性值
 */
function getDeepValue(path: string, obj: PlainObject | null): any {
  if (obj !== null) {
    return obj[path] || traversePath(path.split('.'), false, obj);
  }
  return undefined;
}

/**
 * 设置对象的深层值
 * @param path 属性路径
 * @param value 要设置的值
 * @param obj 目标对象
 */
function setDeepValue(path: string, value: any, obj: PlainObject): void {
  const pathSegments = path.split('.');
  const lastKey = pathSegments.pop();
  const parentObj = traversePath(pathSegments, true, obj);
  if (parentObj && lastKey) {
    parentObj[lastKey] = value;
  }
}

/**
 * 判断两个对象是否不深度相等
 * @param a 对象 a
 * @param b 对象 b
 * @returns 如果不相等返回 true，否则返回 false
 */
function notDeepEqual(a: any, b: any): boolean {
  if (a === null && b === null) return false;
  if (a === null) return true;
  if (b === null) return true;

  if (typeof a === 'object') {
    if (Array.isArray(a)) {
      const arrB = b as any[];
      if (a.length !== arrB.length) return true;
      for (let i = 0; i < a.length; i++) {
        if (notDeepEqual(a[i], arrB[i])) return true;
      }
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return true;

    for (const key of keysA) {
      if (notDeepEqual(a[key], b[key])) return true;
    }
    return false;
  }

  return a !== b;
}

/**
 * 遍历对象的属性路径
 * @param pathSegments 属性路径数组
 * @param createIfMissing 如果属性不存在是否创建
 * @param obj 目标对象
 * @returns 路径末尾的对象
 */
function traversePath(pathSegments: string[], createIfMissing: boolean, obj: PlainObject): PlainObject | undefined {
  let currentObj: PlainObject | undefined = obj;
  for (const segment of pathSegments) {
    if (currentObj === undefined) return undefined;
    if (!(segment in currentObj)) {
      if (!createIfMissing) return undefined;
      currentObj[segment] = {};
    }
    currentObj = currentObj[segment];
  }
  return currentObj;
}

/**
 * 合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @param mergeArrays 是否合并数组
 * @returns 合并后的对象
 */
function mergeObjects(target: PlainObject | undefined, source: PlainObject, mergeArrays: boolean): PlainObject {
  if (!source) return target || {};

  return Object.keys(source).reduce((acc, key) => {
    const targetValue = acc[key];
    const sourceValue = source[key];

    if (targetValue === sourceValue) return acc;
    if (targetValue === undefined) {
      acc[key] = clone(sourceValue);
      return acc;
    }

    if (Array.isArray(sourceValue) || Array.isArray(targetValue)) {
      let targetArray = Array.isArray(targetValue) ? targetValue.slice() : [targetValue];
      if (sourceValue) {
        const sourceArray = Array.isArray(sourceValue) ? sourceValue : [sourceValue];
        if (mergeArrays) {
          sourceArray.forEach((item) => {
            if (!targetArray.includes(item)) {
              targetArray.push(item);
            }
          });
        } else {
          targetArray = sourceArray.slice();
        }
      }
      acc[key] = targetArray;
    } else if (sourceValue && typeof sourceValue === 'object') {
      acc[key] = mergeObjects(targetValue, sourceValue, mergeArrays);
    } else if (acc.hasOwnProperty(key) && !source.hasOwnProperty(key)) {
      // 不处理
    } else {
      acc[key] = sourceValue;
    }

    return acc;
  }, target || {});
}

export {
  clone,
  equals,
  equalsShallow,
  fixJson,
  isAccessorLike,
  isClonable,
  isPlainObject,
  tryClone,
  deepMerge,
  getDeepValue,
  notDeepEqual,
  setDeepValue,
};
