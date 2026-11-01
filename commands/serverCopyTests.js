import assert from 'assert/strict'
import { randomBytes } from 'crypto'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    utimesSync,
    writeFileSync,
} from 'fs'
import test from 'node:test'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from '../scripts/terminal.js'

test('changed archives reuse matching data and preserve exact contents', async context => {
    const directory = mkdtempSync(join(tmpdir(), 'serverCopy'))
    context.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const toolsDirectory = join(directory, 'tools')
    mkdirSync(toolsDirectory)
    const fixtures = {
        node: `#!/bin/sh
printf '22 dev localhost\n'
`,
        rsync: `#!/bin/sh
exec /usr/bin/rsync --stats "$@"
`,
        ssh: `#!/bin/sh
while [ "$#" -gt 0 ] && [ "$1" != rsync ]; do
    shift
done
shift
exec /usr/bin/rsync "$@"
`,
    }
    for (const [name, source] of Object.entries(fixtures)) {
        writeFileSync(join(toolsDirectory, name), source, { mode: 0o755 })
    }
    const sourcePath = join(directory, 'sourceArchive.zip')
    const destinationPath = join(directory, 'targetArchive.zip')
    const bytes = randomBytes(1024 * 1024)
    writeFileSync(sourcePath, bytes)
    const command = fileURLToPath(new URL('./serverCopy', import.meta.url))
    const copyFile = () => runOnTerminalAsync(`bash '${command}' '${sourcePath}' 'fixture:${destinationPath}' changes`, {
        env: {
            ...process.env,
            PATH: `${toolsDirectory}:${process.env.PATH}`,
            TERM: 'xterm',
        },
        throwOnError: true,
    })
    await copyFile()
    assert.deepEqual(readFileSync(destinationPath), bytes)
    bytes.fill(7, 65536, 65664)
    writeFileSync(sourcePath, bytes)
    for (const path of [sourcePath, destinationPath]) {
        utimesSync(path, new Date(0), new Date(0))
    }
    const changed = await copyFile()
    const transferred = Number(changed.match(/Literal data: ([\d,]+) bytes/)[1].replaceAll(',', ''))
    context.diagnostic(`Updated ${bytes.length} bytes using ${transferred} transferred bytes`)
    assert.ok(transferred < bytes.length / 8)
    assert.deepEqual(readFileSync(destinationPath), bytes)
    assert.match(await copyFile(), /Literal data: 0 bytes/)
    writeFileSync(join(toolsDirectory, 'ssh'), '#!/bin/sh\nexit 7\n', { mode: 0o755 })
    bytes[0] ^= 1
    writeFileSync(sourcePath, bytes)
    const previous = readFileSync(destinationPath)
    await assert.rejects(copyFile)
    assert.deepEqual(readFileSync(destinationPath), previous)
})
