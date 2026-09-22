import { join } from 'path'
import {
    isFile,
    removeAndRecreateDir,
    writeFile,
} from './os.js'

const entryConfigurations = [
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
            if (!isFile(join(processPath, '..', themeDirectory, `${configuration.type}.jsx`))) return
            const theme = themeDirectory.slice('theme'.length)
            const component = `Theme${theme}${configuration.suffix}`
            imports.push(`import ${component} from '../themes/${theme}/${configuration.type}'`)
            properties.push(`    '${theme}': ${component},`)
        })
        const content = `${imports.join('\n')}\n\nexport default {\n${properties.join('\n')}\n}\n`
        writeFile(`${directory}/index.jsx`, content)
    })
}
