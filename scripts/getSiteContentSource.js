import fs from 'fs'
import path from 'path'

export default params => {
    const declaration = path.join(params.processPath, 'contentSource')
    if (!fs.existsSync(declaration)) return null
    const repository = fs.readFileSync(declaration, 'utf8').trim()
    if (!/^[a-z][a-zA-Z0-9]*$/.test(repository)) {
        throw new Error(`Invalid site content source: ${repository}`)
    }
    const source = path.join(params.home, repository)
    if (!fs.statSync(source).isDirectory()) {
        throw new Error(`Site content source does not exist: ${source}`)
    }
    const contentSource = {
        repository,
        source,
        target: path.join(params.containerHome, `${repository}Content`),
    }
    return contentSource
}
