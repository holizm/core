import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import {
    runOnTerminal,
    runOnTerminalAsync,
} from './terminal.js'

test('status checks committed, staged and untracked files and continues after a finding', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'statusPolicies'))
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const repository = join(directory, 'example')
    mkdirSync(repository)
    const checkerDirectory = join(directory, 'core', 'commands')
    mkdirSync(checkerDirectory, { recursive: true })
    writeFileSync(join(checkerDirectory, 'check'), '#!/bin/sh\nprintf "Checked %s %s\\n" "$1" "$2"\ncase "$1" in *staged.js) exit 1;; esac\n', { mode: 0o755 })

    const git = command => runOnTerminal(`git -C '${repository}' ${command}`, { throwOnError: true })
    const commit = message => git(`-c user.email=test@example.com -c user.name=Test -c commit.gpgsign=false commit -m ${message}`)
    git('init -b main')
    writeFileSync(join(repository, 'base.js'), '')
    writeFileSync(join(repository, 'unstaged.js'), '')
    git('add base.js unstaged.js')
    commit('base')
    git('branch upstream')
    git('branch --set-upstream-to=upstream')
    writeFileSync(join(repository, 'committed.js'), '')
    git('add committed.js')
    commit('ahead')
    git('rm base.js')
    writeFileSync(join(repository, 'unstaged.js'), 'changed')
    writeFileSync(join(repository, 'staged.js'), '')
    git('add staged.js')
    writeFileSync(join(repository, `untracked's file.js`), '')

    const output = await runOnTerminalAsync(`node '${join(import.meta.dirname, '../commands/status')}' example`, {
        env: {
            ...process.env,
            HOME: directory,
        },
        throwOnError: true,
    })
    for (const name of ['committed.js', 'staged.js', 'unstaged.js', `untracked's file.js`]) {
        assert.ok(output.includes(`Checked ${repository}/${name} --noClear`), output)
    }
    assert.ok(!output.includes(`Checked ${repository}/base.js`), output)
})
