import type { UiState } from "../genetics";
export type { UiState };

export function normalizeUi(ui: UiState): UiState {
  const u = { ...ui };
  if (u.series === "tortie") u.sex = "F";
  if (u.series === "orange") u.tabby = true;
  return u;
}

export const QUICK: { label: string; ui: UiState }[] = [
  { label: "狸花",   ui: { series: "black",  dilute: false, tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "黑猫",   ui: { series: "black",  dilute: false, tabby: false, white: 0, long: false, sex: "?" } },
  { label: "橘猫",   ui: { series: "orange", dilute: false, tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "长毛橘", ui: { series: "orange", dilute: false, tabby: true,  white: 0, long: true,  sex: "M" } },
  { label: "奶牛",   ui: { series: "black",  dilute: false, tabby: false, white: 2, long: false, sex: "?" } },
  { label: "三花",   ui: { series: "tortie", dilute: false, tabby: false, white: 2, long: false, sex: "F" } },
  { label: "玳瑁",   ui: { series: "tortie", dilute: false, tabby: false, white: 0, long: false, sex: "F" } },
  { label: "蓝猫",   ui: { series: "black",  dilute: true,  tabby: false, white: 0, long: false, sex: "?" } },
  { label: "蓝白",   ui: { series: "black",  dilute: true,  tabby: false, white: 2, long: false, sex: "?" } },
  { label: "橘白",   ui: { series: "orange", dilute: false, tabby: true,  white: 2, long: false, sex: "?" } },
  { label: "奶油",   ui: { series: "orange", dilute: true,  tabby: true,  white: 0, long: false, sex: "?" } },
  { label: "狸花白", ui: { series: "black",  dilute: false, tabby: true,  white: 2, long: false, sex: "?" } },
];
