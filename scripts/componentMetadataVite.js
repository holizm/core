import { transformSync } from '@babel/core'
import addComponentMetadata from './addComponentMetadata.js'
import resolveComponentMetadata from './resolveComponentMetadata.js'
import resolveSiteRouteClass from './resolveSiteRouteClass.js'

export default () => {
    const plugin = {
        enforce: 'pre',
        name: 'componentMetadata',
        transform(code, id) {
            if (!resolveComponentMetadata(id) && !resolveSiteRouteClass(id)) return null
            const result = transformSync(code, {
                babelrc: false,
                configFile: false,
                parserOpts: { plugins: ['jsx', 'typescript'] },
                plugins: [[addComponentMetadata, { id }]],
                retainLines: true,
            })
            const transformed = {
                code: result.code,
                map: null,
            }
            return transformed
        },
    }
    return plugin
}
