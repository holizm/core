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

for (const configuredOnly of [false, true]) {
    test(`removes configured sources with configuredOnly=${configuredOnly}`, () => {
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
            const sourceNames = [
                'safeeyes-team-ubuntu-safeeyes-resolute.sources',
                'safeeyes-team-ubuntu-safeeyes-noble.list',
            ]
            for (const name of sourceNames) writeFileSync(join(sources, name), name)
            writeFileSync(join(bin, 'sudo'), '#!/bin/bash\nexec "$@"\n', { mode: 0o755 })
            writeFileSync(join(bin, 'apt-get'), `#!/bin/bash
for argument in "$@"; do
    if [[ "$argument" == *safeeyes-team* ]]; then
        echo 'Permission denied: configured sources must not be probed'
        exit 1
    fi
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
            const argumentsList = configuredOnly ? [script, '--configured-only'] : [script]
            execFileSync('bash', argumentsList, {
                env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
            })
            assert.equal(existsSync(join(sources, 'healthy.list')), true)
            assert.equal(existsSync(join(sources, 'ubuntu.sources')), true)
            assert.equal(existsSync(join(sources, 'broken.sources')), configuredOnly)
            const backupDirectory = join(backups, readdirSync(backups)[0])
            for (const name of sourceNames) {
                assert.equal(existsSync(join(sources, name)), false)
                assert.equal(readFileSync(join(backupDirectory, name), 'utf8'), name)
            }
            if (!configuredOnly) assert.equal(readFileSync(join(backupDirectory, 'broken.sources'), 'utf8'), 'broken')
            execFileSync('bash', argumentsList, {
                env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
            })
            assert.equal(readdirSync(backupDirectory).length, configuredOnly ? 2 : 3)
        } finally {
            rmSync(directory, { force: true, recursive: true })
        }
    })
}
