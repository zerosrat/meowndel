export function norm(a: string, b: string): string {
  if (a === b) return a + a;
  return a === a.toUpperCase() ? a + b : b + a;
}

// 循环顺序即输出顺序，是与旧引擎对齐的契约，不要"优化"
export function crossAuto(g1: string, g2: string): string[] {
  const seen: Record<string, 1> = {};
  const r: string[] = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const k = norm(g1[i], g2[j]);
      if (!seen[k]) { seen[k] = 1; r.push(k); }
    }
  }
  return r;
}

export function crossO(fx: string, mg: string): { M: string[]; F: string[] } {
  const mAll = mg[0] === mg[1] ? [mg[0]] : [mg[0], mg[1]];
  const seen: Record<string, 1> = {};
  const fr: string[] = [];
  for (let i = 0; i < mAll.length; i++) {
    const k = norm(fx, mAll[i]);
    if (!seen[k]) { seen[k] = 1; fr.push(k); }
  }
  return { M: mAll, F: fr };
}
