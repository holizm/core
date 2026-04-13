import fs from 'fs'
import { getContent } from './os.js'

export default params => {
    const { host } = params
    let content = getContent('/etc/hosts')
    if (!content.includes(` ${host}`) && !content.includes(`\t${host}`)) {
        if (!content.endsWith('\n')) content += '\n'
        fs.appendFileSync('/etc/hosts', `127.0.0.1 ${host}\n`)
    }
}
