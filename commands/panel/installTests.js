import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'

for (const failure of ['stale', 'network']) {
    test(`panel installation handles ${failure} failure`, t => {
        const directory = mkdtempSync(join(tmpdir(), 'panelInstall'))
        t.after(() => rmSync(directory, { force: true, recursive: true }))
        const processPath = join(directory, 'example/adminPanel')
        const bin = join(directory, 'bin')
        const calls = join(directory, 'calls')
        mkdirSync(join(processPath, 'node_modules'), { recursive: true })
        mkdirSync(bin)
        writeFileSync(join(processPath, 'package-lock.json'), '{}')
        writeFileSync(join(processPath, 'package.json'), '{}')
        const installer = new URL('../installPackages', import.meta.url).pathname
        writeFileSync(join(bin, 'installPackages'), `#!/bin/bash\nexec bash '${installer}' "$@"\n`, { mode: 0o755 })
        writeFileSync(join(bin, 'npm'), `#!/bin/bash
printf '%s\\n' "$1" >> "$calls"
if [[ "$failure" == network ]]; then
    echo 'npm error code ECONNRESET' >&2
    exit 1
fi
printf '{"updated":true}\\n' > package-lock.json
`, { mode: 0o755 })
        const options = {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${bin}:${process.env.PATH}`,
                calls,
                failure,
                home: directory,
                process: 'adminPanel',
                repo: 'example',
            },
        }
        const command = new URL('./install', import.meta.url).pathname
        const result = spawnSync('bash', [command], options)
        const marker = join(processPath, 'node_modules/.installedLockHash')
        if (failure === 'stale') {
            assert.equal(result.status, 0, result.stderr)
            assert.equal(readFileSync(calls, 'utf8'), 'install\n')
            writeFileSync(join(processPath, 'package.json'), '{"dependencies":{"example":"2.0.0"}}')
            assert.equal(spawnSync('bash', [command], options).status, 0)
            assert.equal(readFileSync(calls, 'utf8'), 'install\ninstall\n')
            assert.equal(existsSync(marker), true)
            assert.equal(spawnSync('bash', [command], options).status, 0)
            assert.equal(readFileSync(calls, 'utf8'), 'install\ninstall\n')
        } else {
            assert.equal(result.status, 1)
            assert.equal(readFileSync(calls, 'utf8'), 'install\n')
            assert.equal(existsSync(marker), false)
        }
    })
}
