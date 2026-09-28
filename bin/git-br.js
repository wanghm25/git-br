#!/usr/bin/env node

'use strict';

const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const packageJson = require('../package.json');

const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  green: '\u001b[32m',
  cyan: '\u001b[36m',
  yellow: '\u001b[33m',
};

function printHelp() {
  process.stdout.write(`git-br ${packageJson.version}

Usage:
  git br [--no-color]

Options:
  --no-color  Disable ANSI colors
  --help      Show this help
  --version   Show the installed version

Branch descriptions are read from branch.<name>.description and can be edited
with "git branch --edit-description".
`);
}

function parseArgs(argv) {
  let noColor = false;

  for (const argument of argv) {
    if (argument === '--no-color') {
      noColor = true;
    } else if (argument === '--help' || argument === '-h') {
      printHelp();
      process.exit(0);
    } else if (argument === '--version' || argument === '-v') {
      process.stdout.write(`${packageJson.version}\n`);
      process.exit(0);
    } else {
      process.stderr.write(
        `git-br: unsupported argument: ${argument}\n` +
          'git-br only lists branches; use "git branch" for branch operations.\n',
      );
      process.exit(2);
    }
  }

  return { noColor };
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    const message = (result.stderr || '').trim();
    throw new Error(message || `git ${args.join(' ')} failed`);
  }

  return result.status === 0 ? result.stdout.replace(/\n$/, '') : '';
}

function readBranches() {
  const separator = '%1f';
  const format = [
    '%(refname:short)',
    '%(objectname:short)',
    '%(subject)',
  ].join(separator);

  const output = runGit([
    'for-each-ref',
    '--sort=refname',
    `--format=${format}`,
    'refs/heads/',
  ]);

  if (!output) {
    return [];
  }

  return output.split('\n').map((line) => {
    const [name, commit, subject] = line.split('\u001f');
    const description = runGit(
      ['config', '--get', `branch.${name}.description`],
      { allowFailure: true },
    )
      .replace(/\s+/g, ' ')
      .trim();

    return {
      name,
      commit,
      subject,
      description,
    };
  });
}

function readWorktrees() {
  const output = runGit(['worktree', 'list', '--porcelain', '-z']);
  const worktrees = new Map();
  let worktreePath = '';

  for (const field of output.split('\0')) {
    if (field.startsWith('worktree ')) {
      worktreePath = field.slice('worktree '.length);
    } else if (field.startsWith('branch refs/heads/')) {
      worktrees.set(field.slice('branch refs/heads/'.length), worktreePath);
    } else if (field === '') {
      worktreePath = '';
    }
  }

  return worktrees;
}

function currentBranch() {
  return runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], {
    allowFailure: true,
  });
}

function mainBranch(branches) {
  const branchNames = new Set(branches.map((branch) => branch.name));
  const remoteHead = runGit(
    ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'],
    { allowFailure: true },
  );
  const remoteMain = remoteHead.replace(/^origin\//, '');

  if (branchNames.has(remoteMain)) {
    return remoteMain;
  }
  if (branchNames.has('main')) {
    return 'main';
  }
  if (branchNames.has('master')) {
    return 'master';
  }
  return '';
}

function sortBranches(branches, activeBranch, repositoryMainBranch) {
  return [...branches].sort((left, right) => {
    const rank = (branch) => {
      if (branch.name === activeBranch) {
        return 0;
      }
      if (branch.name === repositoryMainBranch) {
        return 1;
      }
      return 2;
    };

    const rankDifference = rank(left) - rank(right);
    if (rankDifference !== 0) {
      return rankDifference;
    }
    return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
  });
}

function colorize(enabled, color, value) {
  return enabled ? `${color}${value}${ANSI.reset}` : value;
}

function shortPath(worktreePath, repositoryPath) {
  if (!worktreePath) {
    return '';
  }
  if (path.resolve(worktreePath) === path.resolve(repositoryPath)) {
    return 'current';
  }

  const home = os.homedir();
  return worktreePath === home || worktreePath.startsWith(`${home}${path.sep}`)
    ? `~${worktreePath.slice(home.length)}`
    : worktreePath;
}

function render(branches, worktrees, activeBranch, options) {
  const colorEnabled =
    !options.noColor && process.stdout.isTTY && !process.env.NO_COLOR;
  const repositoryPath = runGit(['rev-parse', '--show-toplevel']);

  for (const branch of branches) {
    const worktreePath = worktrees.get(branch.name) || '';
    const isCurrent = branch.name === activeBranch;
    const isOtherWorktree = Boolean(worktreePath) && !isCurrent;
    const marker = isCurrent ? '*' : isOtherWorktree ? '+' : ' ';
    const markerColor = isCurrent ? ANSI.green : ANSI.cyan;
    const branchColor = isCurrent ? ANSI.bold + ANSI.green : isOtherWorktree ? ANSI.cyan : '';
    const detail = branch.description || branch.subject || branch.commit;
    const detailLabel = branch.description ? 'description' : 'last commit';
    const hasWorktree = Boolean(worktreePath);

    process.stdout.write(
      `${colorize(colorEnabled, markerColor, marker)} ${colorize(colorEnabled, branchColor, branch.name)}\n`,
    );
    process.stdout.write(
      `  ${colorize(colorEnabled, ANSI.dim, hasWorktree ? '├─' : '└─')} ` +
        `${colorize(colorEnabled, ANSI.dim, `${detailLabel}:`)} ` +
        `${colorize(colorEnabled, branch.description ? '' : ANSI.dim, detail)}\n`,
    );

    if (hasWorktree) {
      process.stdout.write(
        `  ${colorize(colorEnabled, ANSI.dim, '└─')} ` +
          `${colorize(colorEnabled, ANSI.dim, 'worktree:')} ` +
          `${colorize(colorEnabled, isOtherWorktree ? ANSI.cyan : ANSI.green, shortPath(worktreePath, repositoryPath))}\n`,
      );
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  try {
    runGit(['rev-parse', '--git-dir']);
    const branches = readBranches();
    const activeBranch = currentBranch();
    render(
      sortBranches(branches, activeBranch, mainBranch(branches)),
      readWorktrees(),
      activeBranch,
      options,
    );
  } catch (error) {
    process.stderr.write(`git-br: ${error.message}\n`);
    process.exit(1);
  }
}

main();
