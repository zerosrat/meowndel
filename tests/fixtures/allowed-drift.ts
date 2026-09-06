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
        out[role] = { yes, no };
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
  // ⚠️ gallery 的归一化器里，这一条必须排在最后：
  //    前面的归一化器只处理 yes / no，由它统一重建截断字段。
  {
    task: "Task 14",
    field: "gallery",
    reason: "去掉 shownYes / shownNo 两个截断字段",
    normalize: (g: any) => {
      const out: any = {};
      for (const role of ["mother", "father"]) {
        const { yes, no } = g[role];
        out[role] = { yes, no, shownYes: yes.slice(0, 6), shownNo: no.slice(0, 5) };
      }
      return out;
    },
  },
];
export const INVARIANTS: DriftInvariant[] = [
  {
    task: "Task 15",
    field: "target",
    reason: "白斑等级 1–4 改为 {Ss,SS} 全集：s 位点只放宽，其余位点必须完全不变",
    applies: (raw) => raw.white >= 1,
    holds: (base: any, cur: any) => {
      const strip = (t: any) => JSON.stringify({ ...t, s: null });
      if (strip(base) !== strip(cur)) return false;              // 其余位点一字不动
      return Object.keys(base.s).every((g) => cur.s[g] === 1);   // s 只增不减
    },
  },
  {
    task: "Task 15",
    field: "parents",
    reason: "目标变宽 ⇒ 合法亲代配对只增不减；o/d/a/l 四个位点必须完全不变",
    applies: (raw) => raw.white >= 1,
    holds: (base: any, cur: any) => {
      for (const loc of ["o", "d", "a", "l"]) {
        if (JSON.stringify(base.pairs[loc]) !== JSON.stringify(cur.pairs[loc])) return false;
        if (JSON.stringify(base.f[loc]) !== JSON.stringify(cur.f[loc])) return false;
        if (JSON.stringify(base.m[loc]) !== JSON.stringify(cur.m[loc])) return false;
      }
      const has = (ps: [string, string][], a: string, b: string) =>
        ps.some(([x, y]) => x === a && y === b);
      return base.pairs.s.every(([a, b]: [string, string]) => has(cur.pairs.s, a, b));
    },
  },
  {
    task: "Task 15",
    field: "gallery",
    reason: "white=4 时目标 s 集合从 {SS} 变成 {Ss,SS}，亲代边缘集新增 ss，导致 white=0 的花色第一次通过 canonAsParent：候选只增不减，且不丢基线花色",
    applies: (raw) => raw.white === 4,
    holds: (base: any, cur: any) => {
      for (const role of ["mother", "father"]) {
        const cy = cur[role].yes.filter((n: string) => !ADDED_11.includes(n));
        const cn = cur[role].no.filter((n: string) => !ADDED_11.includes(n));
        // 基线里是候选的，现在必须还是候选（只增不减）
        if (!base[role].yes.every((n: string) => cy.includes(n))) return false;
        // 现在被判不可能的，基线里必须也是不可能（no 只减不增）
        if (!cn.every((n: string) => base[role].no.includes(n))) return false;
        // 两者合起来仍是完整的基线花色集合，一个都没丢
        if (cy.length + cn.length !== base[role].yes.length + base[role].no.length) return false;
      }
      return true;
    },
  },
  {
    task: "Task 15",
    field: "mates",
    reason: "white=4 时目标 s 集合变宽，配偶后代 s 值联集新增 ss：后代花色只增不减，nope 只减不增，毛长结论与 S 位点无关必须不变",
    applies: (raw) => raw.white === 4,
    holds: (base: any[], cur: any[]) => {
      const kept = cur.filter((m) => m.name !== "长毛狸花猫");
      if (kept.length !== base.length) return false;
      for (let k = 0; k < base.length; k++) {
        if (kept[k].name !== base[k].name) return false;      // 配偶顺序与名字不变
        const b = base[k].result, c = kept[k].result;
        if (!b !== !c) return false;                          // null 与非 null 的对应关系不变
        if (!b) continue;
        if (!b.names.every((n: string) => c.names.includes(n))) return false;   // 后代花色只增不减
        const cn = c.nope.filter((n: string) => !ADDED_11.includes(n));
        if (!cn.every((n: string) => b.nope.includes(n))) return false;         // nope 只减不增
        if (c.longPossible !== b.longPossible) return false;                    // 毛长结论与 S 位点无关，必须不变
      }
      return true;
    },
  },
];
