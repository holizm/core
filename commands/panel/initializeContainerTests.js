import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'

test('failed development installation leaves the container alive and a successful retry restores readiness', t => {
    const ready = '/tmp/panelReady'
    const failed = '/tmp/panelInitializationFailed'
    if (existsSync(ready) || existsSync(failed)) return t.skip('Readiness markers are already in use')
    const directory = mkdtempSync(join(tmpdir(), 'panelInitialization'))
    t.after(() => {
        rmSync(directory, { force: true, recursive: true })
        rmSync(ready, { force: true })
        rmSync(failed, { force: true })
    })
    const processPath = join(directory, 'example/adminPanel')
    const bin = join(directory, 'bin')
    mkdirSync(bin)
    mkdirSync(processPath, { recursive: true })
    for (const name of ['merge', 'initialize', 'install']) {
        writeFileSync(join(bin, name), `#!/bin/sh\nexit ${name === 'install' ? 1 : 0}\n`, { mode: 0o755 })
    }
    const options = {
        cwd: processPath,
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            home: directory,
            isCiCd: 'false',
            process: 'adminPanel',
            processPath,
            repo: 'example',
        },
    }
    const result = spawnSync(process.execPath, [new URL('./initializeContainer', import.meta.url).pathname], options)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(ready), false)
    assert.equal(existsSync(failed), true)
    assert.match(result.stdout, /container remains available/)
    writeFileSync(join(processPath, 'package.json'), '{}')
    writeFileSync(join(bin, 'npm'), '#!/bin/sh\nmkdir -p node_modules\nprintf "{}" > package-lock.json\n', { mode: 0o755 })
    const retry = spawnSync('bash', [new URL('../installPackages', import.meta.url).pathname], options)
    assert.equal(retry.status, 0, retry.stderr)
    assert.equal(existsSync(failed), false)
    assert.equal(existsSync(ready), true)
})
