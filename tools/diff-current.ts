import { readFileSync } from "node:fs";
import { buildStates, FIELDS } from "./build-states";

const baseline = JSON.parse(readFileSync("tests/fixtures/legacy-golden.json", "utf8"));
const current = buildStates();

console.log("=== 相对冻结基线的差异 ===");
for (const field of FIELDS) {
  const changed: number[] = [];
  current.forEach((cur, i) => {
    if (JSON.stringify(cur[field]) !== JSON.stringify(baseline.states[i][field])) changed.push(i);
  });
  console.log(
    `${field.padEnd(14)} ${String(changed.length).padStart(3)} / ${current.length}` +
    (changed.length && changed.length <= 8 ? `  → #${changed.join(", #")}` : "")
  );
  if (changed.length) {
    const i = changed[0];
    console.log(`   首例 #${i} ui=${JSON.stringify(current[i].raw)}`);
    console.log(`   旧: ${JSON.stringify(baseline.states[i][field])}`);
    console.log(`   新: ${JSON.stringify(current[i][field])}`);
  }
}
