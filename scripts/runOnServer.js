import {
    divide,
    info,
} from './logger.js'
import { runOnTerminal } from './terminal.js'

export default (domain, command) => {
    divide()
    info(`Running command: ${command}`)
    divide()
    runOnTerminal(`runOnServer ${domain} '${command}'`)
}
