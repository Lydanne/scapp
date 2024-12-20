export type Constructor<T> = new (...args: any[]) => T;

export type FunctionArgs<F> = F extends (...args: infer A) => any ? A : never;

export type AnyFunction = (...args: any[]) => any;

export type AnyObject = Record<string, any>;

/**
 * 提取方法参数类型
 */
export type ParamsType<T> = T extends (...args: infer P) => any ? P : never;
