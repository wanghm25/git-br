# Changelog

## 2.0.0 — Unreleased

- Rewrote branch reading with structured Git output to handle worktrees correctly.
- Kept branch descriptions and added the latest commit subject as a fallback.
- Added a vertical layout with complete branch names and worktree paths.
- Ordered the current branch first, then the repository's main branch, then other branches by name.
- Kept `git-br` as the executable, published under the new `@wanghm25/git-br` npm scope.
- Limited `git br` to listing branches; branch operations use Git's native commands.

## Upstream history

The fork retains the upstream Git history and tags `v1.1.0`–`v1.1.2`. Earlier release notes are available in [bahmutov/git-branches](https://github.com/bahmutov/git-branches).
