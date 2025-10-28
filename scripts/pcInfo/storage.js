import { execSync } from 'child_process'
import { check, error } from '../../scripts/logger.js'

function run(cmd) {
    try {
        return execSync(cmd).toString().trim()
    } catch {
        return ''
    }
}

export default () => {
    const lsblkOutput = run("lsblk -o NAME,TYPE,SIZE,ROTA,MODEL | grep 'disk'") || ''
    if (!lsblkOutput) {
        error('Could not detect any storage devices')
        return
    }

    const lines = lsblkOutput.split('\n')
    let hasSsd = false
    lines.forEach(line => {
        const parts = line.split(/\s+/)
        const name = parts[0] || 'Unknown'
        const type = parts[1] || 'disk'
        const size = parts[2] || 'Unknown'
        const rota = parts[3] || '1' // ROTA=1 means spinning disk, 0 = SSD
        const model = parts.slice(4).join(' ') || 'Unknown'

        const isSsd = rota === '0' || /SSD|NVMe/i.test(model)
        if (isSsd) hasSsd = true

        check(`Drive: ${name} (${model}) Size: ${size} ${isSsd ? 'SSD' : 'HDD ❌'}`)
    })

    if (hasSsd) check('At least one SSD detected')
    else error('No SSD detected ❌')
}
