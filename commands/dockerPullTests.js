import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('dockerPull pulls every requested image in order and stops on failure', t => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'containerPull'))
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const log = path.join(directory, 'calls')
    writeFileSync(path.join(directory, 'docker'), `#!/bin/sh
printf '%s\\n' "$*" >> "$pullLog"
if [ "$2" = "$failedImage" ]; then
    exit 7
fi
`, { mode: 0o755 })
    const images = [
        'nefcanto/api',
        'nefcanto/panel',
        'nefcanto/site',
        'mongo',
        'redis',
        'getmeili/meilisearch:latest',
    ]
    for (const failedImage of ['', 'nefcanto/panel']) {
        writeFileSync(log, '')
        const result = spawnSync(process.execPath, [
            path.join(import.meta.dirname, 'dockerPull'),
        ], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${directory}:${process.env.PATH}`,
                failedImage,
                pullLog: log,
            },
        })
        assert.equal(result.status === 0, !failedImage, result.stderr)
        const expected = failedImage ? images.slice(0, 2) : images
        assert.equal(readFileSync(log, 'utf8'), expected.map(image => `pull ${image}\n`).join(''))
    }
})
