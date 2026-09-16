import type { CoatSpec, UiState } from "../genetics";
import { QUICK } from "./types";
import CatPortrait from "./CatPortrait";

// legacy 614-624: renderPicks()
export default function QuickPicks({
  ui, onPick,
}: {
  ui: UiState; onPick: (next: UiState) => void;
}) {
  return (
    <div className="picks">
      {QUICK.map((q, i) => {
        const sp: CoatSpec = {
          series: q.ui.series,
          dilute: q.ui.dilute,
          tabby: q.ui.series === "orange" ? true : q.ui.tabby,
          white: q.ui.white,
          long: q.ui.long,
        };
        const on =
          q.ui.series === ui.series &&
          q.ui.dilute === ui.dilute &&
          q.ui.white === ui.white &&
          q.ui.long === ui.long &&
          (q.ui.series === "orange" || q.ui.tabby === ui.tabby);
        return (
          <button
            key={i}
            className="pick"
            aria-pressed={on}
            style={{ color: "var(--cat-line)" }}
            onClick={() => onPick({ ...q.ui })}
          >
            <CatPortrait spec={sp} seed={i + 3} size={34} />
            <span>{q.label}</span>
          </button>
        );
      })}
    </div>
  );
}
