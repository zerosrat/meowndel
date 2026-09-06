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

// Task 11 新增：CANON 里新加的两个长毛条目，多处归一化器都要用到。
const ADDED_11 = ["长毛狸花猫", "长毛橘猫"];

export const NORMALIZERS: DriftNormalizer[] = [
  {
    task: "Task 11",
    field: "gallery",
    reason: "CANON 新增两个长毛条目",
    normalize: (g: any) => {
      const out: any = {};
      for (const role of ["mother", "father"]) {
        const yes = g[role].yes.filter((n: string) => !ADDED_11.includes(n));
        const no = g[role].no.filter((n: string) => !ADDED_11.includes(n));
        out[role] = { yes, no, shownYes: yes.slice(0, 6), shownNo: no.slice(0, 5) };
      }
      return out;
    },
  },
  {
    task: "Task 11",
    field: "mates",
    reason: "CANON 新增的两个长毛条目会恒定出现在后代结果的 nope 列表里",
    normalize: (mates: any[]) =>
      mates.map((m) =>
        m.result
          ? { ...m, result: { ...m.result, nope: m.result.nope.filter((n: string) => !ADDED_11.includes(n)) } }
          : m
      ),
  },
  {
    task: "Task 13",
    field: "mates",
    reason: "配偶列表新增长毛狸花猫；ChildrenResult 新增 shortPossible 字段",
    normalize: (mates: any[]) =>
      mates
        .filter((m) => m.name !== "长毛狸花猫")
        .map((m) => {
          if (!m.result) return m;
          // 解构去掉新字段，其余键的插入顺序保持不变
          const { shortPossible, ...rest } = m.result;
          return { ...m, result: rest };
        }),
  },
];
export const INVARIANTS: DriftInvariant[] = [];
