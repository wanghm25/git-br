# Contributing

Issues and focused pull requests are welcome. Please include your operating system, Git and Node.js versions, the command you ran, and a small reproduction when reporting a display problem. Avoid sharing private repository names or paths unless needed to reproduce the issue.

Run these checks before opening a pull request:

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

`git br` only lists branches. Please keep changes within that scope and document any visible output change in both README files and `CHANGELOG.md`.

For a release, update the version and changelog, run the checks above, inspect the npm package contents, then create a matching Git tag and GitHub Release. Publishing to npm is a separate maintainer action; the CI workflow does not publish packages.
