/**
 * 检查 Map 中是否有任何值满足指定条件
 * @param map 要检查的 Map 对象
 * @param predicate 判断每个值是否满足条件的函数
 * @returns 如果存在值满足条件返回 true，否则返回 false
 */
export function someMap<K, V>(map: Map<K, V>, predicate: (_value: V) => boolean): boolean {
  for (const value of map.values()) {
    if (predicate(value)) {
      return true;
    }
  }
  return false;
}

/**
 * 在 Map 中查找满足条件的第一个值
 * @param map 要查找的 Map 对象
 * @param predicate 判断每个值是否满足条件的函数
 * @returns 第一个满足条件的值，如果没有找到则返回 null
 */
export function findInMap<K, V>(map: Map<K, V>, predicate: (_value: V) => boolean): V | null {
  for (const value of map.values()) {
    if (predicate(value)) {
      return value;
    }
  }
  return null;
}

/**
 * 获取 Map 中的值，如果不存在则创建并存储新值
 * @param map 操作的 Map 对象
 * @param key 要获取或创建的值的键
 * @param defaultValueCreator 当键不存在时创建默认值的函数
 * @returns Map 中对应键的值
 */
export function getOrCreateMapValue<K, V>(map: Map<K, V>, key: K, defaultValueCreator: () => V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = defaultValueCreator();
    map.set(key, value);
  }
  return value;
}

/**
 * 创建一个记忆化函数，缓存函数的计算结果
 * @param compute 原始计算函数
 * @returns 记忆化后的函数，相同输入将返回缓存的结果
 */
export function memoize<T, R>(compute: (_input: T) => R): (_input: T) => R {
  const cache = new Map<T, R>();
  return (input: T): R => {
    if (!cache.has(input)) {
      cache.set(input, compute(input));
    }
    return cache.get(input)!;
  };
}
