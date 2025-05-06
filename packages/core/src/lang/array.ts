// 内存重新分配相关常量
const REALLOC_GROWTH_FACTOR = 1.5;
const REALLOC_SHRINK_FACTOR = 1 / REALLOC_GROWTH_FACTOR;
const REALLOC_SHRINK_THRESHOLD = 0.5;

// 恒等函数
function identity<T>(value: T): T {
  return value;
}

/**
 * 向数组中添加多个元素
 * @param target 目标数组
 * @param items 要添加的元素数组
 * @returns 添加元素后的目标数组
 */
function addMany<T>(target: T[], items?: T[]): T[] {
  if (!items) return target;
  for (const item of items) {
    target.push(item);
  }
  return target;
}

/**
 * 比较两个数组是否相等
 * @param array1 第一个数组
 * @param array2 第二个数组
 * @param comparer 用于比较元素的函数
 * @returns 如果数组相等返回 true，否则返回 false
 */
function equals<T>(
  array1: T[] | null | undefined,
  array2: T[] | null | undefined,
  comparer?: (a: T, b: T) => boolean
): boolean {
  if (array1 === null && array2 === null) return true;
  if (array1 === null || array2 === null || (array1 as T[]).length !== (array2 as T[]).length) return false;
  if (comparer) {
    for (let i = 0; i < (array1 as T[]).length; i++) {
      if (!comparer((array1 as T[])[i], (array2 as T[])[i])) return false;
    }
  } else {
    for (let i = 0; i < (array1 as T[]).length; i++) {
      if ((array1 as T[])[i] !== (array2 as T[])[i]) return false;
    }
  }
  return true;
}

const emptyArray: any[] = [];

export { emptyArray, equals };
