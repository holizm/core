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

for (const hasLegacyDatabase of [false, true]) {
    test(`certificate setup repairs trust with legacy database present: ${hasLegacyDatabase}`, t => {
        const home = mkdtempSync(join(tmpdir(), 'certificateTrust'))
        t.after(() => rmSync(home, { force: true, recursive: true }))
        const bin = join(home, 'bin')
        const calls = join(home, 'calls')
        const legacy = join(home, '.pki/nssdb')
        const modern = join(home, '.local/share/pki/nssdb')
        mkdirSync(bin)
        if (hasLegacyDatabase) {
            mkdirSync(legacy, { recursive: true })
            writeFileSync(join(legacy, 'cert9.db'), 'existing database')
        }
        writeFileSync(join(bin, 'mkcert'), '#!/bin/sh\necho "mkcert $*" >> "$calls"\n[ "$1" != -CAROOT ] || echo "$HOME/authority"\n', { mode: 0o755 })
        writeFileSync(join(bin, 'openssl'), '#!/bin/sh\necho "openssl $*" >> "$calls"\n', { mode: 0o755 })
        writeFileSync(join(bin, 'certutil'), `#!/bin/bash
    echo "certutil $*" >> "$calls"
    if [[ "$1" == -N ]]; then
        touch "\${3#sql:}/cert9.db"
    fi
    `, { mode: 0o755 })
        const options = {
            encoding: 'utf8',
            env: {
                ...process.env,
                HOME: home,
                PATH: `${bin}:${process.env.PATH}`,
                calls,
                scripts: new URL('../scripts', import.meta.url).pathname,
            },
        }
        const command = new URL('./mkcert', import.meta.url).pathname
        for (const attempt of [0, 1]) {
            const result = spawnSync('bash', [command], options)
            assert.equal(result.status, 0, result.stderr)
            assert.equal(existsSync(join(modern, 'cert9.db')), true)
            if (hasLegacyDatabase) {
                assert.equal(readFileSync(join(legacy, 'cert9.db'), 'utf8'), 'existing database')
            } else {
                assert.equal(existsSync(legacy), false)
            }
            const log = readFileSync(calls, 'utf8')
            assert.equal((log.match(/mkcert -install/g) || []).length, attempt + 1)
            assert.equal((log.match(/certutil -A/g) || []).length, (attempt + 1) * (hasLegacyDatabase ? 2 : 1))
            assert.equal((log.match(/certutil -N/g) || []).length, 1)
            assert.match(log, /certutil -V/)
        }
    })
}
