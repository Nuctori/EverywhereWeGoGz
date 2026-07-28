import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
const helper = path.join(root, 'scripts', 'push_generated_commit.sh');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'push-generated-commit-'));

function git(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: 'pipe' });
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function configure(cwd) {
  git(cwd, 'config', 'user.name', 'test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'core.autocrlf', 'false');
  try {
    git(cwd, 'reset', '--hard', 'HEAD');
  } catch {
    // The seed repository has no commit yet.
  }
}

function commit(cwd, file, content, message) {
  write(path.join(cwd, file), content);
  git(cwd, 'add', file);
  git(cwd, 'commit', '-m', message);
}

const remote = path.join(tempRoot, 'remote.git');
const seed = path.join(tempRoot, 'seed');
const writer = path.join(tempRoot, 'writer');
const racer = path.join(tempRoot, 'racer');

fs.mkdirSync(seed, { recursive: true });
git(seed, 'init');
configure(seed);
commit(seed, 'README.md', 'base\n', 'base');
git(seed, 'branch', '-M', 'main');
git(seed, 'init', '--bare', remote);
git(seed, 'remote', 'add', 'origin', remote);
git(seed, 'push', '-u', 'origin', 'main');

git(tempRoot, 'clone', '-b', 'main', remote, writer);
git(tempRoot, 'clone', '-b', 'main', remote, racer);
configure(writer);
configure(racer);

commit(writer, 'generated.txt', 'generated\n', 'generated data');
commit(racer, 'cache.txt', 'cache\n', 'cache refresh');
git(racer, 'push', 'origin', 'main');

const recovered = spawnSync('bash', [helper], {
  cwd: writer,
  encoding: 'utf8',
  env: { ...process.env, GITHUB_REF_NAME: 'main', GIT_TERMINAL_PROMPT: '0' },
});
assert.equal(recovered.status, 0, `expected non-conflicting remote advance to rebase and publish\n${recovered.stdout}\n${recovered.stderr}`);
assert.equal(fs.readFileSync(path.join(writer, 'cache.txt'), 'utf8'), 'cache\n');
assert.equal(fs.readFileSync(path.join(writer, 'generated.txt'), 'utf8'), 'generated\n');

commit(writer, 'conflict.txt', 'base\n', 'conflict base');
git(writer, 'push', 'origin', 'main');
git(racer, 'pull', '--ff-only', 'origin', 'main');
commit(writer, 'conflict.txt', 'writer\n', 'writer conflict');
commit(racer, 'conflict.txt', 'racer\n', 'racer conflict');
git(racer, 'push', 'origin', 'main');

const conflicted = spawnSync('bash', [helper], {
  cwd: writer,
  encoding: 'utf8',
  env: { ...process.env, GITHUB_REF_NAME: 'main', GIT_TERMINAL_PROMPT: '0' },
});
assert.equal(conflicted.status, 1, 'expected rebase conflict to fail without force-pushing');
assert.equal(git(writer, 'status', '--porcelain'), '', 'expected failed rebase to abort cleanly');
git(racer, 'pull', '--ff-only', 'origin', 'main');
assert.equal(fs.readFileSync(path.join(racer, 'conflict.txt'), 'utf8'), 'racer\n');

console.log('push generated commit integration audit passed');
