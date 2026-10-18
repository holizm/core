import isFile from './isFile.js'
import {
    createDirIfNotExists,
    createFileIfNotExists,
    writeFile,
} from './os.js'

const ensureHeadlessPanelStructure = (basePath, structure) => {
    for (const [name, node] of Object.entries(structure)) {
        const nodePath = `${basePath}/${name}`
        if (node && typeof node === 'object') {
            createDirIfNotExists(nodePath)
            ensureHeadlessPanelStructure(nodePath, node)
            continue
        }
        if (!isFile(nodePath)) {
            createFileIfNotExists(nodePath)
            if (node) {
                writeFile(nodePath, node)
            }
        }
    }
}

export default ensureHeadlessPanelStructure
