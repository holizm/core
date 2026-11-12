import fg from 'fast-glob'
import { getContent } from '../../scripts/os.js'

export default (processDirectory, home) => {
    const dependencyDirectory = `${processDirectory}/node_modules`
    const parts = fg.sync('*/part', {
        cwd: dependencyDirectory,
        onlyFiles: true,
    }).map(file => file.split('/')[0])
    const files = fg.sync(parts.map(part => `${home}/${part}/api/data/**/*.json`), {
        absolute: true,
        cwd: dependencyDirectory,
        onlyFiles: true,
    }).sort().filter(file => {
        const items = JSON.parse(getContent(file))
        return Array.isArray(items) && items.every(item => typeof item?.id === 'string' && item.id.length > 0)
    })
    return files
}
