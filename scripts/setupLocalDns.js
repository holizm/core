import fs from 'fs'
import { getContent } from './os.js'
import reconcileLocalDns from './reconcileLocalDns.js'

export default params => {
    const { hosts } = params
    const content = getContent('/etc/hosts')
    const result = reconcileLocalDns(content, hosts)
    if (result === content) return false
    fs.writeFileSync('/etc/hosts', result)
    return true
}
