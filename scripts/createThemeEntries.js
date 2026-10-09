import { join } from 'path'
import isFile from './isFile.js'
import {
    removeAndRecreateDir,
    writeFile,
} from './os.js'

const entryConfigurations = [
    {
        directory: 'themeHeads',
        suffix: 'Head',
        type: 'head',
    },
    {
        directory: 'themeIndexes',
        suffix: 'Index',
        type: 'index',
    },
    {
        directory: 'themeLayouts',
        suffix: 'Layout',
        type: 'layout',
    },
]

export default params => {
    const {
        multiThemed,
        process,
        processPath,
        repo,
        themeDirectories,
    } = params
    if (!multiThemed) return
    entryConfigurations.forEach(configuration => {
        const directory = `/tmp/${repo}/${process}/${configuration.directory}`
        removeAndRecreateDir(directory)
        const imports = []
        const properties = []
        themeDirectories.forEach(themeDirectory => {
            if (!isFile(join(processPath, '..', themeDirectory, 'pages', `${configuration.type}.jsx`))) return
            const theme = themeDirectory.slice('theme'.length)
            const component = `Theme${theme}${configuration.suffix}`
            if (configuration.type === 'layout') {
                properties.push(`    '${theme}': () => import('../themes/${theme}/pages/layout'),`)
            }
            else {
                imports.push(`import ${component} from '../themes/${theme}/pages/${configuration.type}'`)
                properties.push(`    '${theme}': ${component},`)
            }
        })
        const importBlock = imports.length ? `${imports.join('\n')}\n\n` : ''
        const content = `${importBlock}export default {\n${properties.join('\n')}\n}\n`
        writeFile(`${directory}/index.jsx`, content)
    })
}
