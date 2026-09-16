# 同底稿花色实验

2026-09-15，独立美术验证，入口 `layers.html`。原四品种 Demo 保留。

## 本轮实现

- 一张 AI 中性田园猫底稿，运行时通过 Canvas 合成六种配色。
- 分别绘制底色、条纹/三花色块、白斑；再使用底稿的灰度明暗和纸感调制颜色。
- 彩色线稿、鼻子、内耳、眼睛及高光受保护，透明度继承底稿。
- 切换花色、花纹和白斑开关、查看底稿、三种背景、透明 PNG 导出。
- 页面启动时检查六份输出的全部 alpha 像素，并检查五官采样点。采样检查不代表全部五官逐像素验证。

## 边界

手绘色块坐标仅适用于这一张底稿；未接入遗传模型，不自动支持其他姿势或品种。黑色采用抬亮的炭黑保留五官可读性。中性底稿由 AI 编辑得到，和获批橘白原图的局部细节仍有差异。

## 中性底稿生成

工具：内置 image_gen。参考 `flat-assets/domestic-shape-v4.png`，输出 `flat-assets/domestic-neutral-master.png`。

Prompt:

Use case: precise-object-edit. Prepare this EXACT approved cartoon domestic cat as a neutral recoloring master. Preserve its exact outline proportions pose facial features eye and nose positions paws tail all line art and square image alignment. Change ALL fur to UNIFORM very light neutral gray (#dddddd) with no orange, no stripes, no patches, no white bib or socks or tail tip. Keep minimal existing shape shadows in neutral gray and fine paper grain, not flat featureless fill. Keep eyes dark brown with white glints, nose pink, inner ears pink, all outlines and whiskers dark brown unchanged. Make ear tufts SAME gray as coat. This is neutral master for runtime layer compositing, so fur pigment must be entirely neutral GRAYSCALE; only fixed facial details and dark brown outlines and pink ears remain colored. NO redesign, no extra features, no 3D. Transparent alpha background, no floor shadow, same full-body framing.
