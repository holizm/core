import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { test } from 'node:test'
import commitRepo from './commitRepo.js'

const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
}).trim()

await test('commit removes tracked AGENTS.md from Git and keeps the file', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'commitRepo'))
    try {
        git(repo, ['init'])
        git(repo, ['config', 'user.name', 'Git test'])
        git(repo, ['config', 'user.email', 'gitTest@example.invalid'])
        git(repo, ['config', 'commit.gpgsign', 'false'])
        await writeFile(path.join(repo, 'AGENTS.md'), 'Local instructions')
        await writeFile(path.join(repo, 'sample.txt'), 'Before')
        git(repo, ['add', '-f', 'AGENTS.md', 'sample.txt'])
        git(repo, ['commit', '-m', 'base'])
        await writeFile(path.join(repo, 'sample.txt'), 'After')
        assert.equal(commitRepo(repo), true)
        assert.equal(git(repo, ['ls-files']), 'sample.txt')
        assert.equal(git(repo, ['show', 'HEAD:sample.txt']), 'After')
        assert.equal(await readFile(path.join(repo, 'AGENTS.md'), 'utf8'), 'Local instructions')
    }
    finally {
        await rm(repo, { force: true, recursive: true })
    }
})

await test('commit skips an AGENTS.md-only change after removing it from Git', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'commitRepo'))
    try {
        git(repo, ['init'])
        await writeFile(path.join(repo, 'AGENTS.md'), 'Local instructions')
        git(repo, ['add', '-f', 'AGENTS.md'])
        assert.equal(commitRepo(repo), false)
        assert.equal(git(repo, ['ls-files']), '')
        assert.equal(await readFile(path.join(repo, 'AGENTS.md'), 'utf8'), 'Local instructions')
    }
    finally {
        await rm(repo, { force: true, recursive: true })
    }
})

await test('commit removes previously committed AGENTS.md from a clean repository', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'commitRepo'))
    try {
        git(repo, ['init'])
        git(repo, ['config', 'user.name', 'Git test'])
        git(repo, ['config', 'user.email', 'gitTest@example.invalid'])
        git(repo, ['config', 'commit.gpgsign', 'false'])
        await writeFile(path.join(repo, 'AGENTS.md'), 'Local instructions')
        git(repo, ['add', '-f', 'AGENTS.md'])
        git(repo, ['commit', '-m', 'base'])
        assert.equal(git(repo, ['status', '--porcelain']), '')
        assert.equal(commitRepo(repo), true)
        assert.equal(git(repo, ['ls-files']), '')
        assert.equal(await readFile(path.join(repo, 'AGENTS.md'), 'utf8'), 'Local instructions')
    }
    finally {
        await rm(repo, { force: true, recursive: true })
    }
})
