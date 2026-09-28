'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.join(__dirname, 'git-br.js');

function command(executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function git(args, cwd) {
  const result = command('git', args, cwd);
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

describe('git br', () => {
  let root;
  let repository;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'git-br-'));
    repository = path.join(root, 'repository');
    fs.mkdirSync(repository);
    git(['init', '--quiet'], repository);
    git(['config', 'user.name', 'Git Br Test'], repository);
    git(['config', 'user.email', 'git-br@example.invalid'], repository);
    fs.writeFileSync(path.join(repository, 'file.txt'), 'initial\n');
    git(['add', 'file.txt'], repository);
    git(['commit', '--quiet', '-m', 'Initial commit'], repository);
    git(['branch', '-m', 'main'], repository);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('lists the current branch first and the main branch second, with complete names', () => {
    const longName = 'feature/a-very-long-branch-name-that-must-stay-copyable';
    git(['branch', 'alpha'], repository);
    git(['branch', longName], repository);
    git(['switch', '--quiet', longName], repository);

    const result = command(process.execPath, [cli, '--no-color'], repository);
    const names = result.stdout.split('\n').filter((line) => /^[*+ ] [^ ├└]/.test(line));

    expect(result.status).toBe(0);
    expect(names).toEqual([`* ${longName}`, '  main', '  alpha']);
    expect(result.stdout).not.toContain('SYNC');
  });

  it('shows a branch description instead of its last commit', () => {
    git(['config', 'branch.main.description', 'Main branch description'], repository);

    const result = command(process.execPath, [cli, '--no-color'], repository);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('* main\n');
    expect(result.stdout).toContain('description: Main branch description\n');
    expect(result.stdout).not.toContain('last commit: Initial commit');
  });

  it('marks another worktree and shows its path', () => {
    const otherWorktree = path.join(root, 'other-worktree');
    git(['worktree', 'add', '--quiet', '-b', 'feature/worktree', otherWorktree], repository);

    const result = command(process.execPath, [cli, '--no-color'], repository);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('+ feature/worktree\n');
    expect(result.stdout).toContain(`worktree: ${fs.realpathSync(otherWorktree)}\n`);
    expect(result.stdout).toContain('worktree: current\n');
  });

  it('lists local branches when HEAD is detached', () => {
    git(['checkout', '--quiet', '--detach'], repository);
    const result = command(process.execPath, [cli, '--no-color'], repository);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('  main\n');
    expect(result.stdout).not.toContain('* main\n');
  });

  it('rejects branch operations and reports non-repository errors', () => {
    const unsupported = command(process.execPath, [cli, '-d', 'main'], repository);
    const outside = command(process.execPath, [cli], root);

    expect(unsupported.status).toBe(2);
    expect(unsupported.stderr).toContain('unsupported argument: -d');
    expect(outside.status).toBe(1);
    expect(outside.stderr).toContain('not a git repository');
  });
});
