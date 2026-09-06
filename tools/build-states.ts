import {
  buildTarget, solveParents, parentClaims, kidClaims,
  mateList, childrenWith, canonAsParent, CANON,
  type ParentSolution, type UiState, type Series,
} from "../src/genetics";
import { catSVG } from "../src/render/catSVG";
import { normalizeUi } from "../src/ui/types";

export const FIELDS = [
  "target", "parents", "parentClaims", "kidClaims", "gallery", "mates", "selfSvg",
] as const;
export type Field = (typeof FIELDS)[number];

export interface GoldenState {
  raw: UiState; ui: UiState;
  target: unknown; parents: unknown;
  parentClaims: unknown; kidClaims: unknown;
  gallery: unknown; mates: unknown; selfSvg: string;
}

function specFromUI(ui: UiState) {
  return {
    series: ui.series, dilute: ui.dilute,
    tabby: ui.series === "orange" ? true : ui.tabby,
    white: ui.white, long: ui.long,
  };
}

function gallery(res: ParentSolution) {
  const out: Record<string, unknown> = {};
  for (const role of ["mother", "father"] as const) {
    const yes: string[] = [], no: string[] = [];
    CANON.forEach((c) => {
      (canonAsParent(c, role, res) ? yes : no).push(c.name);
    });
    out[role] = { yes, no };
  }
  return out;
}

export function buildStates(): GoldenState[] {
  const states: GoldenState[] = [];
  for (const series of ["black", "orange", "tortie"] as Series[])
  for (const dilute of [false, true])
  for (const tabby of [true, false])
  for (let white = 0; white < 5; white++)
  for (const long of [false, true])
  for (const sex of ["M", "F", "?"] as const) {
    const raw: UiState = { series, dilute, tabby, white, long, sex };
    const ui = normalizeUi(raw);
    const target = buildTarget(ui);
    const res = solveParents(target);
    const list = mateList(target);
    states.push({
      raw, ui, target,
      parents: res,
      parentClaims: parentClaims(ui, target, res),
      kidClaims: kidClaims(ui, target),
      gallery: gallery(res),
      mates: list.map((m) => ({ name: m.name, result: childrenWith(target, m) })),
      selfSvg: catSVG(specFromUI(ui), 7, 190),
    });
  }
  return states;
}
