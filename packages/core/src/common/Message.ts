/* eslint-disable */

import { getDeepValue } from '../lang/object.js';

/**
 * 替换字符串中的占位符为实际值
 * @param template 包含占位符的模板字符串
 * @param context 包含实际值的上下文对象
 * @returns 替换后的字符串
 */
function replacePlaceholders(template: string, context: Record<string, any>): string {
  return template.replaceAll(/\$\{([^\s:}]*)(?::([^\s:}]+))?\}/g, (match, key: string) => {
    if (key === '') return '$';
    const value = getDeepValue(key, context);
    return (value ?? '').toString();
  });
}

export class AppMessage {
  name: string;
  details: any;
  message: string;

  /**
   * 构造函数
   * @param name 消息名称
   * @param template 消息模板字符串
   * @param details 包含实际值的上下文对象
   */
  constructor(name: string, template: string | undefined, details?: any) {
    this.name = name;
    this.details = details;
    this.message = template ? replacePlaceholders(template, details) : '';
  }

  toString(): string {
    return '[' + this.name + ']: ' + this.message;
  }
}
