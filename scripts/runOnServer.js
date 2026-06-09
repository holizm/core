import {
    divide,
    info,
} from './logger.js'
import {
    runOnTerminal,
    runStreaming,
} from './terminal.js'

export default async (domain, command, returnResults = false) => {
    const escaped = command.replaceAll(`'`, `'\\''`)

    divide()
    info(`Running command: ${escaped}`)
    divide()

    if (returnResults) {
        return await runOnTerminal(`runOnServer ${domain} '${escaped}'`)
    }

    await runStreaming(`runOnServer ${domain} '${escaped}'`)
}
