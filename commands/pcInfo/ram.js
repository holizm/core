import os from 'os'
import { execSync } from 'child_process'
import { check, error } from '../../logger.js'

function run(cmd) {
    try {
        return execSync(cmd).toString().trim()
    } catch {
        return ''
    }
}

export default () => {
    const totalGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1)
    const desirableGb = 8
    if (totalGb >= desirableGb)
        check(`RAM: ${totalGb} GB`)
    else
        error(`RAM is low: ${totalGb} GB. Recommended at least ${desirableGb} GB`)

    const ramType = run("sudo dmidecode -t memory | grep 'Type:' | grep -v Unknown | head -1 | awk '{print $2}'") || 'Unknown'

    if (ramType !== 'DDR4')
        error(`Your RAM type is ${ramType}. It's not DDR4. Consider upgrading for better performance`)
    else
        check(`RAM Type: ${ramType}`)
}
