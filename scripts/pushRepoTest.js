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
import pushRepo from './pushRepo.js'

const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
}).trim()
const configure = repo => {
    git(repo, ['config', 'user.name', 'Git test'])
    git(repo, ['config', 'user.email', 'gitTest@example.invalid'])
    git(repo, ['config', 'commit.gpgsign', 'false'])
}
const fixture = async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'gitPush'))
    const remote = path.join(directory, 'remote.git')
    const local = path.join(directory, 'local')
    const incoming = path.join(directory, 'incoming')
    git(directory, ['init', '--bare', '--initial-branch=main', remote])
    git(directory, ['clone', remote, local])
    configure(local)
    const lines = Array.from({ length: 30 }, (_, index) => `line ${index}`)
    await writeFile(path.join(local, 'sample.txt'), lines.join('\n'))
    git(local, ['add', '.'])
    git(local, ['commit', '-m', 'base'])
    git(local, ['push', '-u', 'origin', 'main'])
    git(directory, ['clone', remote, incoming])
    configure(incoming)
    git(local, ['config', 'pull.rebase', 'true'])
    git(local, ['config', 'pull.ff', 'only'])
    const repositories = {
        directory,
        incoming,
        local,
        remote,
    }
    return repositories
}
const change = async (repo, index, value) => {
    const file = path.join(repo, 'sample.txt')
    const lines = (await readFile(file, 'utf8')).split('\n')
    lines[index] = value
    await writeFile(file, lines.join('\n'))
    git(repo, ['commit', '-am', value])
}

await test('ort merges changes in different parts of the same file and pushes', async () => {
    const repos = await fixture()
    try {
        await change(repos.local, 0, 'localChange')
        await change(repos.incoming, 29, 'incomingChange')
        git(repos.incoming, ['push'])
        assert.equal(await pushRepo(repos.local), true)
        const contents = git(repos.remote, ['show', 'main:sample.txt'])
        assert.ok(contents.includes('localChange') && contents.includes('incomingChange'))
        assert.equal(git(repos.local, ['log', '-1', '--format=%p']).split(' ').length, 2)
        assert.equal(git(repos.local, ['status', '--porcelain']), '')
    } finally { await rm(repos.directory, { force: true, recursive: true }) }
})

await test('overlapping changes stop with unresolved files and no remote changes', async () => {
    const repos = await fixture()
    try {
        await change(repos.local, 0, 'localChange')
        await change(repos.incoming, 0, 'incomingChange')
        git(repos.incoming, ['push'])
        const remoteHead = git(repos.remote, ['rev-parse', 'main'])
        assert.equal(await pushRepo(repos.local), false)
        assert.ok(git(repos.local, ['ls-files', '--unmerged']))
        assert.throws(() => commitRepo(repos.local), /human review required/)
        assert.equal(await pushRepo(repos.local), false)
        assert.equal(git(repos.remote, ['rev-parse', 'main']), remoteHead)
    } finally { await rm(repos.directory, { force: true, recursive: true }) }
})

await test('push configuration failure is reported without starting a merge', async () => {
    const repos = await fixture()
    try {
        git(repos.local, ['remote', 'remove', 'origin'])
        assert.equal(await pushRepo(repos.local), false)
        assert.equal(git(repos.local, ['status', '--porcelain']), '')
    } finally { await rm(repos.directory, { force: true, recursive: true }) }
})
