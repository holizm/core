import { execSync } from 'child_process'
import { info, check, error } from '../../scripts/logger.js'

function run(cmd) {
    try {
        return execSync(cmd).toString().trim()
    } catch {
        return ''
    }
}

export default () => {
    const biosDate = run("sudo dmidecode -t bios | grep 'Release Date' | awk '{print $3}'") || 'Unknown'
    if (biosDate !== 'Unknown')
        check(`BIOS Date: ${biosDate}`)
    else
        error('BIOS Date could not be determined ❌')
}
