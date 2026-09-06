import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildStates, FIELDS, type Field, type GoldenState } from "../tools/build-states";
import { NORMALIZERS, INVARIANTS } from "./fixtures/allowed-drift";

const baseline = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));
const current = buildStates();

/** 依次施加该字段上所有归一化器，把预期变化抹回基线形态 */
function normalized(cur: GoldenState, field: Field) {
  let v = cur[field];
  for (const n of NORMALIZERS) {
    if (n.field !== field) continue;
    if (n.applies && !n.applies(cur.raw)) continue;
    v = n.normalize(v, cur.raw);
  }
  return v;
}

describe("抹掉已声明的变换后，必须与冻结基线逐字节相同", () => {
  it.each(FIELDS)("字段 %s", (field) => {
    const violations: string[] = [];
    current.forEach((cur, i) => {
      const base = baseline.states[i][field];
      if (JSON.stringify(normalized(cur, field)) === JSON.stringify(base)) return;
      // 归一化抹不掉，那就必须有一条精确不变量兜底
      const ok = INVARIANTS.some(
        (inv) => inv.field === field && inv.applies(cur.raw) &&
                 inv.holds(base, cur[field], cur.raw)
      );
      if (!ok) violations.push(`#${i} ${JSON.stringify(cur.raw)}`);
    });
    expect(violations, `这些状态的 ${field} 出现了未授权的变化`).toEqual([]);
  });
});

describe("归一化器与不变量都不得成为僵尸", () => {
  if (NORMALIZERS.length === 0) {
    it("1A 阶段：归一化器清单为空", () => {
      expect(NORMALIZERS).toEqual([]);
    });
  } else {
    it.each(NORMALIZERS.map((n) => ({ n })))("归一化器 $n.task / $n.field", ({ n }) => {
      const hit = current.some(
        (cur) => (!n.applies || n.applies(cur.raw)) &&
          JSON.stringify(n.normalize(cur[n.field], cur.raw)) !== JSON.stringify(cur[n.field])
      );
      expect(hit, `「${n.task} / ${n.field}」没有抹掉任何东西，说明已过期，应删除`).toBe(true);
    });
  }

  if (INVARIANTS.length === 0) {
    it("1A 阶段：不变量清单为空", () => {
      expect(INVARIANTS).toEqual([]);
    });
  } else {
    it.each(INVARIANTS.map((inv) => ({ inv })))("不变量 $inv.task / $inv.field", ({ inv }) => {
      const hit = current.some((cur, i) =>
        inv.applies(cur.raw) &&
        JSON.stringify(cur[inv.field]) !== JSON.stringify(baseline.states[i][inv.field])
      );
      expect(hit, `「${inv.task} / ${inv.field}」匹配不到任何真实差异，应删除`).toBe(true);
    });
  }
});

describe("归一化器的顺序契约", () => {
  it("Task 14 的 gallery 归一化器必须排在所有 gallery 归一化器的最后", () => {
    const gallery = NORMALIZERS.filter((n) => n.field === "gallery");
    // 前提：确实有多条 gallery 归一化器，这个契约才有意义
    expect(gallery.length).toBeGreaterThan(1);
    expect(gallery[gallery.length - 1].task).toBe("Task 14");
  });
});
