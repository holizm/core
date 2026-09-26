import fs from 'fs'
import path from 'path'
import { getDepth } from './os.js'
import pascalize from './pascalize.js'

export default params => {
    const { processPath } = params
    if (getDepth(processPath) !== 4) return false

    const folder = path.basename(processPath)
    const keywords = [
        'accounts',
        'api',
        'etl',
        'panel',
        'site',
        'worker',
    ]
    const folderLower = folder.toLowerCase()

    if (keywords.some(keyword => folderLower.includes(keyword))) return true

    const files = fs.readdirSync(processPath)
    const pascalFiles = new Set(files.filter(file => fs.statSync(path.join(processPath, file)).isFile()))
    for (const keyword of keywords) {
        if (pascalFiles.has(pascalize(keyword))) return true
    }
    return false
}
