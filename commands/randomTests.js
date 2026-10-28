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

test('prints the selected file before checking it and preserves the check exit status', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'randomTests'))
    try {
        const repository = path.join(directory, 'sample')
        const commands = path.join(directory, 'core', 'commands')
        mkdirSync(path.join(repository, '.git'), { recursive: true })
        mkdirSync(commands, { recursive: true })
        const file = path.join(repository, 'sample file.js')
        writeFileSync(file, 'selectedContent')
        const check = path.join(commands, 'check')
        writeFileSync(check, '#!/usr/bin/env bash\nprintf "checked:%s\\noption:%s\\n" "$1" "$2"\nexit 7\n')
        chmodSync(check, 0o755)
        const preload = path.join(directory, 'preload.mjs')
        writeFileSync(preload, `import os from 'os'\nos.homedir = () => ${JSON.stringify(directory)}\n`)
        const result = spawnSync(process.execPath, [
            '--import',
            preload,
            path.join(import.meta.dirname, 'random'),
        ], { encoding: 'utf8' })
        assert.equal(result.status, 7, result.stderr)
        assert.ok(result.stdout.includes('~/sample/sample file.js\n\nselectedContent\n'))
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
