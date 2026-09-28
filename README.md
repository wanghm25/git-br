# git-br

[简体中文](README.zh-CN.md)

`git br` shows local branches with their descriptions and worktree locations. Branch names stay on their own lines so they are easy to select and copy.

```text
* feature/current
  ├─ description: Working on the current branch
  └─ worktree: current
  main
  └─ last commit: Release v1.0.0
+ feature/another-worktree
  ├─ last commit: Update documentation
  └─ worktree: ~/projects/another-worktree
```

`*` marks the branch checked out here, `+` marks a branch checked out in another worktree, and a blank marker means an ordinary local branch. The current branch appears first, followed by the repository's main branch; the rest are sorted by name. The main branch is read from `origin/HEAD` when available, with `main` and `master` as local fallbacks.

The detail line uses `branch.<name>.description` when set, otherwise the latest commit subject. Colors are enabled in an interactive terminal and disabled for redirected output or when `NO_COLOR` is set. Branch names and worktree paths are never truncated by the program.

## Install

Requires Node.js 18 or newer and a Git version supporting `git for-each-ref` and `git worktree list --porcelain -z`.

Once this version is published on npm:

```sh
npm uninstall --global git-br
npm install --global @wanghm25/git-br
```

For development from a local checkout:

```sh
npm install --global /path/to/git-br
```

The npm package is named `@wanghm25/git-br`, but its executable remains `git-br`; Git discovers it as the `git br` subcommand. If the old `git-br` package is installed, remove it first because both packages provide the same executable.

## Use

```sh
git br
git br --no-color
git br --help
git br --version
```

Set a description for the current branch with `git branch --edit-description`. For creating, deleting, renaming, or switching branches, use Git's own `git branch` and `git switch` commands. Other arguments to `git br` are rejected.

## Develop

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and release preparation notes.

## Origin and license

This repository is a fork of [bahmutov/git-branches](https://github.com/bahmutov/git-branches), created by Gleb Bahmutov. The branch reader and output were rewritten for current Git worktrees. The original copyright notice is retained in [LICENSE-MIT](LICENSE-MIT); this fork is also distributed under the MIT License.
