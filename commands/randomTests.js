import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    chmodSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

for (const scope of ['home', 'repository', 'theme']) test(`selects only files within ${scope} and preserves the check exit status`, () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'randomTests'))
    try {
        const repository = path.join(directory, 'sample')
        const commands = path.join(directory, 'core', 'commands')
        mkdirSync(path.join(repository, '.git'), { recursive: true })
        mkdirSync(commands, { recursive: true })
        const theme = path.join(repository, 'theme01')
        const nested = path.join(theme, 'nested')
        mkdirSync(nested, { recursive: true })
        const file = path.join(nested, 'sample file.js')
        writeFileSync(file, 'selectedContent')
        const cwd = scope === 'home' ? directory : scope === 'repository' ? repository : theme
        if (scope !== 'home') {
            const sibling = scope === 'theme' ? repository : directory
            writeFileSync(path.join(sibling, 'outside.js'), 'outsideContent')
        }
        const check = path.join(commands, 'check')
        writeFileSync(check, '#!/usr/bin/env bash\nprintf "checked:%s\\noption:%s\\n" "$1" "$2"\nexit 7\n')
        chmodSync(check, 0o755)
        const preload = path.join(directory, 'preload.mjs')
        writeFileSync(preload, `import os from 'os'\nos.homedir = () => ${JSON.stringify(directory)}\n`)
        const result = spawnSync(process.execPath, [
            '--import',
            preload,
            path.join(import.meta.dirname, 'random'),
        ], {
            cwd,
            encoding: 'utf8',
        })
        assert.equal(result.status, 7, result.stderr)
        assert.ok(result.stdout.includes('~/sample/theme01/nested/sample file.js\n\nselectedContent\n'))
        assert.ok(!result.stdout.includes('outsideContent'))
        assert.ok(result.stdout.includes(`checked:${file}\n`))
        assert.ok(result.stdout.includes('option:--noClear\n'))
        assert.ok(result.stdout.indexOf('selectedContent') < result.stdout.indexOf('checked:'))
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})

test('an empty current directory does not fall back to another repository', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'randomEmptyTests'))
    try {
        const repository = path.join(directory, 'sample')
        const empty = path.join(repository, 'empty')
        mkdirSync(path.join(repository, '.git'), { recursive: true })
        mkdirSync(empty)
        writeFileSync(path.join(repository, 'outside.js'), 'outsideContent')
        const preload = path.join(directory, 'preload.mjs')
        writeFileSync(preload, `import os from 'os'\nos.homedir = () => ${JSON.stringify(directory)}\n`)
        const result = spawnSync(process.execPath, [
            '--import',
            preload,
            path.join(import.meta.dirname, 'random'),
        ], {
            cwd: empty,
            encoding: 'utf8',
        })
        assert.equal(result.status, 1)
        assert.match(result.stderr, /No text files found in the current directory or its descendants/)
        assert.ok(!result.stdout.includes('outsideContent'))
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
