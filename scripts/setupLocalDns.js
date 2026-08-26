import fs from 'fs'
import { getContent } from './os.js'

export default params => {
    const { hosts } = params
    const content = getContent('/etc/hosts')
    const uniqueHosts = [...new Set(hosts)]
    const missingHosts = uniqueHosts.filter(host =>
        !content.includes(` ${host}`) &&
        !content.includes(`\t${host}`)
    )
    if (missingHosts.length === 0) {
        return
    }
    let entries = missingHosts.map(host => `127.0.0.1 ${host}`).join('\n')
    if (!content.endsWith('\n')) {
        entries = `\n${entries}`
    }
    fs.appendFileSync('/etc/hosts', `${entries}\n`)
}
