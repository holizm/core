import fs from 'fs'
import path from 'path'
import getSiteContentSource from './getSiteContentSource.js'

export default params => {
    const contentSource = getSiteContentSource(params)
    const target = path.join(params.processBuildDir, 'content')
    fs.mkdirSync(target, { recursive: true })
    if (!contentSource) return
    fs.cpSync(contentSource.source, target, {
        filter: source => {
            if (source === contentSource.source || /\.mdx?$/.test(source)) return true
            if (!fs.statSync(source).isDirectory()) return false
            return !path.basename(source).startsWith('.') && path.basename(source) !== 'node_modules'
        },
        recursive: true,
    })
}
