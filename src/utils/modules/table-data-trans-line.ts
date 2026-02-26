import dayjs from 'dayjs';

export const tableNoDataStr = '/';

export function transStrToLine(v: any) {
  if (v === '') {
    return tableNoDataStr;
  }
  if (v === null) {
    return tableNoDataStr;
  }
  return v;
}

interface MaskOptions<T> {
  /** 手机号字段（11 位手机号，中间 4 位脱敏） */
  mobileKeys?: (keyof T)[];
  /** 普通脱敏字段（前 2 + 后 2，其余脱敏） */
  maskKeys?: (keyof T)[];
}

interface TransformOptions<TInput, TOutput> {
  excludeKeys?: (keyof TInput)[];
  timeKeys?: Partial<Record<keyof TInput, string>>;
  keyOverrides?: Partial<TOutput>;
  addPerCentKeys?: (keyof TInput)[];
  maskOptions?: MaskOptions<TInput>;
}

/* ====================== 脱敏工具 ====================== */

export function maskValue(value: any, isMobile: boolean): string {
  if (value == null || value === '')
    return '/';

  const str = String(value);

  // 手机号：11 位，中间 4 位脱敏
  if (isMobile && /^1\d{10}$/.test(str)) {
    return str.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  }

  // 非手机号：前 2 + 后 2
  if (str.length <= 4) {
    return '*'.repeat(str.length);
  }

  return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
}

/**
 * @description
 * @date 2026-01-23 09:40:20
 * @author tingfeng
 *
 * 泛型转换函数：用于将任意表格数据对象（item）进行统一格式化，生成更适合表格组件展示的新数据结构。
 * 支持对时间字段格式化、空值转换、字段排除、键名重写、以及数值字段自动添加百分号等操作。
 *
 * @template TInput  输入对象类型，一般为原始接口返回的数据结构。
 * @template TOutput 输出对象类型（默认为与输入相同），可用于在字段转换后定义新的结构类型。
 *
 * @param {TInput} item
 * 要处理的表格数据对象。通常是单行原始数据，例如后端接口返回的记录项。
 *
 * @param {TransformOptions<TInput, TOutput>} [options]
 * 可选配置项，用于控制转换行为，包括以下字段：
 *
 * @param {Array<keyof TInput>} [options.excludeKeys]
 * 指定在转换过程中需要排除的字段（这些字段将保持原样，不进行字符串或格式转换）。
 *
 * @param {Record<string, string>} [options.timeKeys]
 * 指定需要进行时间格式化的字段及对应格式化模板。
 * 例如：`{ createTime: 'YYYY-MM-DD HH:mm:ss' }`。
 * 当字段在该映射中存在时，会使用 `dayjs` 进行格式化。
 *
 * @param {Partial<TOutput>} [options.keyOverrides]
 * 指定需要覆盖或新增到结果对象中的键值对。
 * 通常用于手动追加某些展示字段，或重命名字段。
 *
 * @param {Array<keyof TInput>} [options.addPerCentKeys]
 * 指定需要自动添加 `%` 符号的字段。
 * 若该字段值不为空或 `'/'`，则会在末尾追加百分号。
 *
 * @returns {TOutput}
 * 返回转换后的新对象结构，包含以下特征：
 * - 所有普通字符串值会通过 `transStrToLine` 处理（如空值转为 `/`）；
 * - 时间字段会格式化为指定的字符串；
 * - 指定字段会添加百分号；
 * - 被排除字段原样保留；
 * - 可通过 `keyOverrides` 对结果字段进行最终覆盖。
 *
 * @example
 * ```ts
 * const item = {
 *   id: 1,
 *   name: '',
 *   rate: 0.85,
 *   createTime: '2025-04-08T06:09:00Z'
 * }
 *
 * const result = transformItemTyped<typeof item, CollegeTableItem>(item, {
 *   timeKeys: { createTime: 'YYYY-MM-DD HH:mm' },
 *   addPerCentKeys: ['rate'],
 *   keyOverrides: { id: 'A001' }
 * })
 *
 * 输出结果：
 * {
 *   id: 'A001',
 *   name: '/',             // 空值处理
 *   rate: '0.85%',         // 百分号自动添加
 *   createTime: '2025-04-08 14:09' // 时间格式化
 * }
 * ```
 *
 * @note
 * - 内部依赖函数 `transStrToLine` 用于空值与占位符处理；
 * - 若某字段不存在于 `item`，不会主动添加；
 * - 建议在类型安全环境下使用，以充分发挥泛型的推断能力。
 */
export function transformItemTyped<
  TInput extends Record<string, any>,
  TOutput extends Record<string, any> = TInput,
>(item: TInput, options?: TransformOptions<TInput, TOutput>): TOutput {
  const {
    excludeKeys = [],
    timeKeys = {},
    keyOverrides = {},
    addPerCentKeys = [],
    maskOptions,
  } = options || {};

  const timeMap = timeKeys as Record<string, string>;

  const result = Object.keys(item).reduce(
    (acc, key) => {
      const typedKey = key as keyof TInput;
      const rawValue = item[typedKey];

      /* ===== ① 时间字段 ===== */
      if (key in timeMap) {
        const timeStr = rawValue ? dayjs(rawValue).format(timeMap[key]) : '';
        acc[key] = transStrToLine(timeStr);
        return acc;
      }

      /* ===== ② 脱敏字段（新增，不影响原逻辑） ===== */
      if (maskOptions) {
        const { mobileKeys = [], maskKeys = [] } = maskOptions;

        if (mobileKeys.includes(typedKey)) {
          acc[key] = maskValue(rawValue, true);
          return acc;
        }

        if (maskKeys.includes(typedKey)) {
          acc[key] = maskValue(rawValue, false);
          return acc;
        }
      }

      /* ===== ③ 排除字段 ===== */
      if (excludeKeys.includes(typedKey)) {
        acc[key] = rawValue;
        return acc;
      }

      /* ===== ④ 普通字段 ===== */
      let transformed = transStrToLine(rawValue);

      if (addPerCentKeys.includes(typedKey)) {
        transformed = transformed !== '/' ? `${transformed}%` : transformed;
      }

      acc[key] = transformed;
      return acc;
    },
    {} as Record<string, any>,
  );

  return {
    ...result,
    ...keyOverrides,
  } as TOutput;
}
