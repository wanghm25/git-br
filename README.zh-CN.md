# git-br

[English](README.md)

`git br` 展示本地分支、分支描述及 worktree 位置。分支名单独占一行且不会被程序截断，方便选中复制。

```text
* feature/current
  ├─ description: 当前分支的说明
  └─ worktree: current
  main
  └─ last commit: Release v1.0.0
+ feature/another-worktree
  ├─ last commit: 更新文档
  └─ worktree: ~/projects/another-worktree
```

`*` 表示当前目录检出的分支，`+` 表示在其他 worktree 检出的分支，空白标记表示普通本地分支。当前分支排第一，仓库主分支排第二，其余分支按名称排序。主分支优先取 `origin/HEAD`，缺失时依次查找本地 `main`、`master`。

详情优先展示 `branch.<name>.description`；没有描述时展示最近一次提交标题。交互式终端会显示颜色；输出重定向或设置 `NO_COLOR` 时不使用颜色。程序不会截断分支名和 worktree 路径。

## 安装

需要 Node.js 18 或更新版本，以及支持 `git for-each-ref` 和 `git worktree list --porcelain -z` 的 Git。

本版本发布到 npm 后：

```sh
npm uninstall --global git-br
npm install --global @wanghm25/git-br
```

从本地源码安装开发版：

```sh
npm install --global /path/to/git-br
```

npm 包名是 `@wanghm25/git-br`，安装的可执行文件仍叫 `git-br`，因此命令仍是 `git br`。旧包和新包提供同名可执行文件，安装前应先移除旧包。

## 使用

```sh
git br
git br --no-color
git br --help
git br --version
```

使用 `git branch --edit-description` 设置当前分支描述。创建、删除、重命名或切换分支仍使用 Git 自带的 `git branch`、`git checkout`；`git br` 会拒绝其他参数。

## 开发

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

贡献和发版准备见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 来源与许可证

本仓库 Fork 自 Gleb Bahmutov 创建的 [bahmutov/git-branches](https://github.com/bahmutov/git-branches)。当前实现重写了分支读取和展示逻辑，以支持 Git worktree。原作者版权声明保留在 [LICENSE-MIT](LICENSE-MIT)，本项目继续使用 MIT License。
