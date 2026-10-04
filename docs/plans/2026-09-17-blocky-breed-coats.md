# 美短与布偶花色切换验证

> 2026-10-04：当前改为 2D 优先跑通产品，3D 支线暂停。下文保留原交付与验收记录；恢复入口见 [暂停交接](2026-10-04-3d-pause-and-resume.md)。

状态：技术验证完成，等待本轮花色美术验收。四品种外形已获用户认可；承接 `2026-09-17-blocky-four-breeds.md`。仍为总纲阶段 1 后的独立美术支线，未接入品种遗传引擎。

## 范围

- 美短：原银虎斑与新棕虎斑。
- 布偶：原蓝双色与新海豹双色。
- 保存原任务副本后重做材质，保留已认可身体；检查网格和 UV 是否相同，再决定能否只换材质。
- 2026-09-18 用户追加田园猫：基于已认可 cute 身体，新增黑白、三花、无白狸花；英短不变。后续再扩展更多花色，不宣称任意遗传表型已经支持。

## 当前记录

- 新参考图已生成并归档 `reference-breed-american-brown.png`、`reference-breed-ragdoll-seal.png`。
- 美短副本任务 `3fc0c0d0-34a5-4c37-bc77-725299f9c639`；尚未提交新纹理生成。
- 本轮起始积分 2815。

## 图片编辑提示词

美短：Change only coat color of this EXACT cat from silver classic tabby to BROWN classic tabby. Warm golden tan ground coat with dark espresso black-brown classic tabby swirls, forehead M and rings in exactly same positions. Preserve green-gold eyes, pink nose and inner ears, light chin, NO white socks or bib. Keep exact geometry, pose, silhouette, proportions, ivory background, clean matte blocky low-poly style. Single full body character, no text, no hair strands.

布偶：Change only point color of this EXACT blue bicolor Ragdoll to SEAL BICOLOR. Rich deep seal brown ears, outer face mask and bushy tail; warmer pale cream body with a soft brown saddle. Preserve white inverted V face, white muzzle chest ruff belly and legs exactly. Preserve vivid BLUE eyes and pink nose/inner ears. Keep exact geometry, pose, silhouette, proportions, ivory background, matte blocky low-poly style. Single full body character, no text or hair strands.

## 2026-09-18 进展

- Chrome 连接恢复；美短棕虎斑已导出，布偶海豹双色已提交生成。
- 布偶副本任务 `a107760a-1b1c-4646-873f-9bc131ca8510`。
- 新增三张田园猫参考图，使用内置 imagegen 编辑已认可原图；保存至外部归档，后续加入清单。
- 参考图约束：保持同一身体、表情、姿势、块状哑光风格及金色眼睛；黑白为燕尾服白胸白袜，三花为大块黑橘白，无白狸花为棕底细条纹与环尾。
- 美短新旧导出的 accessors 一致，但顶点及 UV 数据不逐字节一致，尚不能直接视为可换材质；先核对，再决定本轮完整模型按需切换或提取共用材质。
- 预算：五套高清材质预计 100 积分，无购买或升级。

## 验收步骤

1. 完成五套材质导出与 2K 优化，保留所有原始文件。
2. 核对网格与 UV；不满足严格条件则使用完整变体按需加载。
3. 页面按品种切换花色，保留灰模、同步视角与田园新旧对照。
4. 检查正侧背、快速切换、移动布局与控制台；运行项目检查。
5. 更新清单哈希、归档说明、提交代码；美术效果等待用户验收。

## 交付结果

入口 `demos/tripo-cat/breed-study.html`。田园猫四款（原棕虎斑加白、黑白、三花、无白狸花），美短银/棕经典虎斑，布偶蓝/海豹双色，英短保留原款。

| 新花色 | Tripo 副本任务 | 网页 GLB 字节 |
| --- | --- | ---: |
| 美短棕虎斑 | 3fc0c0d0-34a5-4c37-bc77-725299f9c639 | 541304 |
| 布偶海豹双色 | a107760a-1b1c-4646-873f-9bc131ca8510 | 516580 |
| 田园黑白 | 7afc6e46-10a4-413f-9ab9-cc175c93a212 | 317052 |
| 田园三花 | 902652e9-bcb1-4ebd-9810-419c34b7bdf0 | 364836 |
| 田园无白狸花 | ff4bbe88-bc5d-4262-b377-91cdb6cf63fe | 379676 |

- 五次高清纹理生成，积分 2815 → 2715，共 100；没有购买或升级。
- 新网页件合计 2,119,448 字节，初始仍只载入四个默认件 1,823,464 字节。新增款点击加载，不预取全部。
- `verify-breed-coats.py` 验证所有变体与各自原模型的有向三角形、UV、节点变换一致（浮点量化 1e-5）；导出顶点顺序有变化。法线重算有微小差异，不纳入复用证明；页面 flatShading 使用面法线。
- 本轮保留完整 GLB 按需切换，以便直接审核 Tripo 导出效果；没有把“造型复用”宣称为已拆分网络资源。后续可据此提取仅材质文件。
- 二进制保存于 `~/.local/share/meowndel/soft-low-poly-cat-2026-09-16`，含五份 4K 原档、五份 2K 网页档及三张新增参考 PNG；Git 记录哈希/任务/恢复脚本，不包含二进制。

## 验证与剩余限制

- 完整 `pnpm run check` 通过：28 个测试文件 / 2268 测试；正式单 HTML 构建通过。
- 独立 demo 严格 TypeScript 检查通过；30 个归档文件哈希与软链接恢复检查通过。
- 浏览器五个新增款加载成功；检查正/侧/背面、灰模中切换、快速切色、田园新旧版本切换。旧版禁用新增花色，回到圆润版恢复选中款。
- 手机 390×844 单列布局，无横向溢出；控制台无错误，检查后恢复窗口。
- 黑白与三花的正面边界清晰；狸花与美短背部条纹仍弱于正/侧面。背面花纹质量是待验收项，不能宣称素材最终定稿。
- 仍是固定花色预设，未接入遗传引擎、未覆盖全部花色、无骨骼动画。
