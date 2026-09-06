---
name: worktree
description: 为喵德尔项目创建、定位或移动 Git worktree。用户要求隔离开发、创建新 worktree 或调整 worktree 路径时使用，统一放在项目主工作区的 .worktree/ 下。
---

# 项目 worktree 约定

所有 linked worktree 放在主工作区的 `.worktree/<task-slug>/`，例如 `.worktree/visual-interaction/`。使用简短的 kebab-case 任务名；分支名按任务命名，例如 `feat/visual-interaction`。用户明确指定的路径或分支优先。

## 定位与创建

- 先查看 `git status --short` 和 `git worktree list --porcelain`，确认当前改动、已有路径及分支。已有任务 worktree 就继续使用，避免重复创建。
- 从普通工作区或 linked worktree 调用时，都先定位主工作区。本项目的共享 Git 目录位于主工作区的 `.git`：

  ```sh
  project_git_dir=$(git rev-parse --path-format=absolute --git-common-dir)
  project_root=$(dirname "$project_git_dir")
  ```

  用 `git worktree list --porcelain` 核对这个主工作区路径。不要直接把当前 `git rev-parse --show-toplevel` 当作主工作区，否则从 linked worktree 执行会产生嵌套的 `.worktree/`。

- 确认主工作区的 `.gitignore` 包含 `/.worktree/`，并用 `git -C "$project_root" check-ignore .worktree/probe` 验证。缺失时补上；这是项目配置修改，不代表可以改动主工作区里的业务代码。
- 使用用户指定的基点；未指定时默认当前工作区的 HEAD，并在创建前记录其提交号。不要自行切换到 main、拉取、合并或变基。
- 检查任务路径未被占用、分支是否已存在，然后用 `git worktree add` 创建。以新分支为例，先把下面的示例名称换成当前任务：

  ```sh
  worktree_base=$(git rev-parse HEAD)
  mkdir -p "$project_root/.worktree"
  git -C "$project_root" worktree add -b feat/example-task "$project_root/.worktree/example-task" "$worktree_base"
  ```

  若目标分支已存在且未被其他 worktree 使用，用 `git worktree add <path> <branch>`。不要覆盖已有分支或目录。

## 移动与交接

- 移动已有工作区用 `git worktree move <verified-old-path> <verified-new-path>`，让 Git 同时更新注册信息；不要仅移动文件夹。移动前检查是否有仍在使用旧目录的任务进程。
- 实现、依赖安装及验证都在目标 worktree 内执行。原工作区未提交的业务改动不自动带入，也不自行清理；如任务依赖它们，先说明基点差异。
- 新 worktree 只继承基点已提交的文件。若本技能或软链尚未提交且新工作区需要它们，仅同步明确属于该配置的文件，不复制其他未提交改动。
- 技能源文件放在 `.agents/skills/worktree/SKILL.md`，Claude Code 通过相对软链 `.claude/skills -> ../.agents/skills` 共用同一份内容。若 `.claude/skills` 已是包含其他技能的目录，则仅为本技能增加相对软链，保留原目录及其他条目。
- 完成后核对 `git worktree list --porcelain`、两个工作区的 `git status --short`、忽略规则及软链可读性；报告分支、基点和最终绝对路径。创建或移动 worktree 不隐含提交、合并、推送或删除授权。
