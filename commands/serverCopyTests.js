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
        node: `#!/usr/bin/env bash
printf '22 dev localhost\n'
`,
        rsync: `#!/usr/bin/env bash
exec /usr/bin/rsync --stats "$@"
`,
        scp: `#!/usr/bin/env bash
exec /bin/cp -- "$3" "\${4#*:}"
`,
        ssh: `#!/usr/bin/env bash
for argument; do
    if [ "$argument" = 'command -v rsync' ]; then
        printf '/usr/bin/rsync\n'
        exit 0
    fi
done
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
    writeFileSync(join(toolsDirectory, 'rsync'), '#!/usr/bin/env bash\nexit 7\n', { mode: 0o755 })
    bytes[0] ^= 1
    writeFileSync(sourcePath, bytes)
    const previous = readFileSync(destinationPath)
    await assert.rejects(copyFile)
    assert.deepEqual(readFileSync(destinationPath), previous)
    writeFileSync(join(toolsDirectory, 'rsync'), fixtures.rsync, { mode: 0o755 })
    writeFileSync(join(toolsDirectory, 'ssh'), '#!/usr/bin/env bash\nexit 127\n', { mode: 0o755 })
    await copyFile()
    assert.deepEqual(readFileSync(destinationPath), bytes)
})
