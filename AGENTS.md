# 项目约定

## 规划文档

- 所有规划文档统一放在项目的 `docs/plans/`，文件名使用 `YYYY-MM-DD-topic.md`。
- 不再单独维护 specs 文档。需求范围、设计取舍、实施步骤和验证要求按需写入同一份计划。
- 明确标注计划状态，区分已确认方向、本轮范围和后续事项；只有范围说明的文档不代表已有完整执行步骤。
- `CONTEXT.md` 保持为领域术语表，长期决策记录仍放在 `docs/adr/`。

## 开发与验证

- 使用 Node 24（见 `.nvmrc`）。开发用 `npm run dev`；完整检查用 `npm run check`；单独检查类型用 `npm run typecheck`，测试用 `npm test`。
- 计划入口为 `docs/plans/README.md`，总体规划为 `docs/plans/2026-09-06-cat-color-v2-design.md`；局部计划须说明与总纲阶段及依赖的关系。
- `tests/fixtures/legacy-golden.json` 是冻结的行为基线，不以重录或宽泛豁免掩盖回归。预期变化须有针对性的 NORMALIZER 或精确 INVARIANT 及独立验证。
- SVG 的直接等价测试不经过 drift 的 NORMALIZERS。渲染器升级需说明测试迁移策略；单猫样板保留旧渲染器和旧基线，独立验证新图。
- 构建产物保持单个 `dist/index.html` 可独立打开；除既有字体外链外，不增加运行时网络依赖或后端。
