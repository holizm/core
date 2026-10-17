import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('the AST watcher loads the logger and reports events without an unknown command', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'astWatcherTests'))
    try {
        for (const target of ['core/scripts', 'core/commands/site', 'example/site', 'bin']) {
            fs.mkdirSync(path.join(directory, target), { recursive: true })
        }
        fs.writeFileSync(path.join(directory, 'core/scripts/logger.sh'), 'info() { printf "event: %s %s\\n" "$1" "$2"; }\n')
        fs.writeFileSync(path.join(directory, 'core/commands/site/astGenerator.js'), '')
        fs.writeFileSync(path.join(directory, 'bin/inotifywait'), '#!/bin/sh\nprintf "%s MODIFY\\n" "$home/example/site/src/example.jsx"\n', { mode: 0o755 })
        fs.writeFileSync(path.join(directory, 'bin/node'), '#!/bin/sh\nprintf "generated: %s\\n" "$2"\n', { mode: 0o755 })
        const result = spawnSync('bash', [path.join(import.meta.dirname, 'watchForAst')], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${directory}/bin:${process.env.PATH}`,
                home: directory,
                process: 'site',
                repo: 'example',
            },
        })
        assert.equal(result.status, 0, result.stderr)
        assert.equal(result.stderr, '')
        assert.ok(result.stdout.includes(`event: ${directory}/example/site/src/example.jsx MODIFY`))
        assert.ok(result.stdout.includes(`generated: ${directory}/example/site/src/example.jsx`))
    }
    finally {
        fs.rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
