import { runOnTerminal } from '../terminal.js'
import {
    check,
    error,
} from '../logger.js'

export default () => {
    const biosDate = runOnTerminal(`sudo dmidecode -t bios | grep 'Release Date' | awk '{print $3}'`) || 'Unknown'
    if (biosDate !== 'Unknown')
        check(`BIOS Date: ${biosDate}`)
    else
        error('BIOS Date could not be determined ❌')
}
