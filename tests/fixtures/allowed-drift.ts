import type { UiState } from "../../src/genetics";
import type { Field } from "../../tools/build-states";

/**
 * 归一化器：把「本次修复引入的预期变化」从当前值里抹掉，
 * 使其能与冻结基线直接比较。抹不掉的差异 = 未授权的回归。
 */
export interface DriftNormalizer {
  task: string;
  field: Field;
  reason: string;
  /** 只处理 applies 为真的状态；其余原样返回 */
  applies?: (raw: UiState) => boolean;
  normalize: (current: any, raw: UiState) => any;
}

/**
 * 少数修复会真正改变数值而非结构（比如白斑集合变宽），无法用归一化抹掉。
 * 这类必须给出**精确不变量**，而不是笼统放行整个字段。
 */
export interface DriftInvariant {
  task: string;
  field: Field;
  reason: string;
  applies: (raw: UiState) => boolean;
  /** 差异必须满足这个断言，否则视为回归 */
  holds: (baseline: any, current: any, raw: UiState) => boolean;
}

// 1A 阶段两个数组都必须为空。
export const NORMALIZERS: DriftNormalizer[] = [];
export const INVARIANTS: DriftInvariant[] = [];
