import { errorAndExit } from './logger.js'
import runOnServer from './runOnServer.js'

export default async (domain, name, paths) => {
    for (const path of paths) {
        const executable = await runOnServer(
            domain,
            `test -x '${path}' && printf '%s' '${path}'`,
            true,
        )
        if (executable) return executable.trim()
    }
    errorAndExit(`${name} executable was not found`)
}
