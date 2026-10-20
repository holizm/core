import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'

test('backs up failing third-party sources and preserves healthy and Ubuntu sources', () => {
    const directory = mkdtempSync(join(tmpdir(), 'setupSources'))
    try {
        const sources = join(directory, 'sources')
        const backups = join(directory, 'backups')
        const bin = join(directory, 'bin')
        mkdirSync(sources)
        mkdirSync(bin)
        writeFileSync(join(sources, 'ubuntu.sources'), 'ubuntu-archive-keyring.gpg')
        writeFileSync(join(sources, 'healthy.list'), 'healthy')
        writeFileSync(join(sources, 'broken.sources'), 'broken')
        writeFileSync(join(bin, 'sudo'), '#!/bin/bash\nexec "$@"\n', { mode: 0o755 })
        writeFileSync(join(bin, 'apt-get'), `#!/bin/bash
for argument in "$@"; do
    if [[ "$argument" == *broken.sources ]]; then
        echo 'E: Failed to fetch repository'
        exit 100
    fi
done
`, { mode: 0o755 })
        const source = readFileSync(new URL('./removeProblematicSources', import.meta.url), 'utf8')
            .replaceAll('/etc/apt/sources.list.d', sources)
            .replace('/var/backups/setupApt', backups)
        const script = join(directory, 'checkSources')
        writeFileSync(script, source)
        execFileSync('bash', [script], {
            env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
        })
        assert.equal(existsSync(join(sources, 'healthy.list')), true)
        assert.equal(existsSync(join(sources, 'ubuntu.sources')), true)
        assert.equal(existsSync(join(sources, 'broken.sources')), false)
        const backup = join(backups, readdirSync(backups)[0], 'broken.sources')
        assert.equal(readFileSync(backup, 'utf8'), 'broken')
    } finally {
        rmSync(directory, { force: true, recursive: true })
    }
})
