import { randomBytes } from 'crypto'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from '../scripts/terminal.js'

export default context => {
    const directory = mkdtempSync('/tmp/serverConnection')
    context.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const toolsDirectory = join(directory, 'tools')
    mkdirSync(toolsDirectory)
    const tools = {
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
    const writeTool = (name, source) => writeFileSync(join(toolsDirectory, name), source, { mode: 0o755 })
    for (const [name, source] of Object.entries(tools)) writeTool(name, source)
    const sourcePath = join(directory, 'sourceArchive.zip')
    const destinationPath = join(directory, 'targetArchive.zip')
    const bytes = randomBytes(1024 * 1024)
    writeFileSync(sourcePath, bytes)
    const command = fileURLToPath(new URL('./serverCopy', import.meta.url))
    const env = {
        ...process.env,
        PATH: `${toolsDirectory}:${process.env.PATH}`,
        TERM: 'xterm',
    }
    const copyFile = prefix => runOnTerminalAsync(`${prefix || ''}bash '${command}' '${sourcePath}' 'fixture:${destinationPath}' changes`, {
        env,
        throwOnError: true,
    })
    const fixture = {
        bytes,
        copyFile,
        destinationPath,
        directory,
        env,
        sourcePath,
        tools,
        writeTool,
    }
    return fixture
}
