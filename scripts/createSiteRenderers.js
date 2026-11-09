import { join } from 'path'
import isFile from './isFile.js'
import { writeFile } from './os.js'

export default ({
    addVolume,
    containerHome,
    dependencies = [],
    home,
    process,
    processPath,
    repo,
}) => {
    const parts = [...new Set(dependencies)].sort().filter(part =>
        isFile(join(home, repo, part, 'site/functions/contentRenderers.jsx'))
        || isFile(join(home, part, 'site/functions/contentRenderers.jsx')))
    const imports = parts.map(part => `import ${part}Renderers from '../parts/${part}/functions/contentRenderers.jsx'`)
    const names = parts.map(part => `${part}Renderers`)
    if (isFile(join(processPath, 'parts/shared/contentRenderers.jsx'))) {
        imports.push(`import siteRenderers from '../pageParts/shared/contentRenderers.jsx'`)
        names.push('siteRenderers')
    }
    const properties = names.map(name => `    ...${name},`)
    const content = [...imports, '', 'export default {', ...properties, '}', ''].join('\n')
    const source = `/tmp/${repo}/${process}/configuredRenderers.js`
    writeFile(source, content)
    addVolume(source, `${containerHome}/${repo}/${process}/src/core/configuredRenderers.js`)
}
