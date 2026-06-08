import {
    divide,
    info,
} from './logger.js'
import { runStreaming } from './terminal.js'

export default async (domain, command) => {
    divide()
    info(`Running command: ${command}`)
    divide()
    await runStreaming(`runOnServer ${domain} '${command}'`)
}
