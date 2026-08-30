import {
    existsSync,
    readFileSync,
    readdirSync,
} from 'node:fs'
import path from 'node:path'

const getFiles = directory =>
    existsSync(directory)
    ?
    readdirSync(directory)
    :
    []

export default (developmentPath, productionPath, search) => {
    const files = new Set([
        ...getFiles(developmentPath),
        ...getFiles(productionPath),
    ])
    const parts = Array.from(files)
        .filter(file => {
            const developmentFile = path.join(developmentPath, file)
            const productionFile = path.join(productionPath, file)
            if (!existsSync(developmentFile) || !existsSync(productionFile)) {
                return true
            }
            return !readFileSync(developmentFile).equals(readFileSync(productionFile))
        })
        .map(file => file.split('.')[0])
        .filter(part => !search || part.includes(search))

    return Array.from(new Set(parts)).sort()
}
