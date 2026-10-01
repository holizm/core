import fs from 'fs'
import path from 'path'

const excludedTypes = new Set(['layout', 'shared', 'svg'])
const sourceCorePattern = /^\/home\/[^/]+\/(?:site\/pageParts|complexPanel\/src\/(?:components|core|panel)|simplePanel\/src\/(?:components|core|panel)|panel\/src\/core)\//
const mappedCorePattern = /\/src\/(?:components|core|coreParts|panel)\//

export default id => {
    const cleanId = id.split('?')[0].replaceAll('\\', '/')
    if (!/\.[jt]sx$/.test(cleanId)) return null
    const fileName = path.basename(cleanId, path.extname(cleanId))
    let part
    let type
    const mappedSite = cleanId.match(/\/src\/parts\/([^/]+)\/parts\/(.+)\.[jt]sx$/)
    const mappedPanel = cleanId.match(/\/src\/([^/]+)\/panel\/[^/]+\/(.+)\.[jt]sx$/)
    const source = cleanId.match(/^(.+)\/([^/]+)\/(site|panel)\/(.+)\.[jt]sx$/)
    if (mappedSite) {
        part = mappedSite[1]
        type = mappedSite[2].split('/')[0]
    }
    else if (mappedPanel) {
        part = mappedPanel[1]
        type = mappedPanel[2].split('/')[0]
    }
    else if (source && fs.existsSync(path.join(source[1], source[2], 'part'))) {
        part = source[2]
        const relative = source[4].split('/')
        if (source[3] === 'site' && relative[0] !== 'parts') return null
        type = relative[1]
    }
    else if (sourceCorePattern.test(cleanId) || mappedCorePattern.test(cleanId)) {
        part = 'core'
    }
    if (!part) return null
    if (type === fileName || excludedTypes.has(type)) type = null
    const metadata = {
        component: fileName,
        part,
        type,
    }
    return metadata
}
