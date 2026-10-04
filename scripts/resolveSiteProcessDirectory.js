import fs from 'fs'
import path from 'path'

export default directory => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    if (!entries.some(entry => entry.isFile() && entry.name.endsWith('.md'))) return directory
    const repository = path.basename(path.dirname(directory))
    const candidates = fs.readdirSync(path.dirname(directory), { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name.endsWith('Site'))
        .map(entry => path.join(path.dirname(directory), entry.name))
        .filter(candidate => {
            const declaration = path.join(candidate, 'contentSource')
            return fs.existsSync(declaration) && fs.readFileSync(declaration, 'utf8').trim() === repository
        })
    return candidates.length === 1 ? candidates[0] : directory
}
