# 视觉验证素材：本地外置存储

2026-09-11：按用户要求，约 46 MB 的模型、图片、截图与附带验证记录移到项目外，不进入 Git。技术小样已完成，整体美术未通过验收；这些是实验归档，不是正式渲染方案。

本机目录：`/Users/zeroyu/.local/share/meowndel/visual-validation-2026-09-11/`。

目录结构保持 `art/`、`references/`、`src/preview2d/assets/`、`src/preview3d/assets/`。项目内同名路径是被 Git 忽略的软链，Vite 仅额外放行这四个实际目录。源代码、计划、测试与生成/验证脚本仍进入 Git；Blender 自动备份和旧失败样板保留在外置归档中，没有删除。

## 恢复

先从本机目录复制完整素材归档到目标机器，再在项目根目录运行：

```sh
node tools/link-visual-assets.mjs /absolute/path/to/visual-validation-2026-09-11
npm run check
```

在本机可省略参数；也可通过 `MEOWNDEL_ASSET_ROOT` 指定归档根目录。脚本不会覆盖已有目录或指向其他地方的软链。

**全新克隆仅有代码不能直接构建或运行全部测试**：主入口仍导入验证页面，构建和模型测试依赖这些素材。本轮只是保存验证现场，不是可独立复现的发布包。Git 不备份外置素材；本地归档尚无远端副本，换机/删目录前需自行备份。

入口：`?preview=cat`（SVG）、`?preview=cat3d`（3D）、`?preview=cat2d`（插画）、`?preview=catlayers`（分层）。构建后单 HTML 仍可离线使用，但 dist 不入库。

## 来源与授权记录

Fripouille 原模型作者 guillaume bolis，原作 https://sketchfab.com/3d-models/3d-modelling-my-cat-fripouille-0ab14bf98e754f8d90fe1bf1c84ca66c ，CC BY 4.0：https://creativecommons.org/licenses/by/4.0/ 。改编包括导出修复、尺度、毛色、灯光和互动。模型与衍生素材不被项目 ISC 授权替代，网页署名保留。

完整授权记录、源文件 SHA-256 与原始公共元数据保存在外置 `art/cat3d/fripouille-v2/ATTRIBUTION.md` 及 `source/`。生成插画提示词在 `docs/plans/2026-09-11-cat-illustration-study.md` 和 `docs/plans/2026-09-11-layered-coat-study.md`。
