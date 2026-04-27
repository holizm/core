import {
    check,
    error,
} from '../logger.js'
import { runOnTerminal } from '../terminal.js'

export default () => {
    const windowingSystem = runOnTerminal(`echo $XDG_SESSION_TYPE`)
    if (windowingSystem === 'x11') {
        check('Windowing system: x11')
    }
    else {
        error(`Windowing system: ${windowingSystem}`)
    }
}
