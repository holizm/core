import fs from 'fs'
import path from 'path'

export default srcBase => {
    const directory = path.join(srcBase, 'partBarrels')
    const aliases = {}
    if (!fs.existsSync(directory)) return aliases

    for (const part of fs.readdirSync(directory)) {
        if (part.startsWith('.') || !fs.existsSync(path.join(srcBase, 'parts', part))) continue
        const partDirectory = path.join(directory, part)
        if (!fs.statSync(partDirectory).isDirectory()) continue
        for (const fileName of fs.readdirSync(partDirectory)) {
            if (!fileName.endsWith('.jsx')) continue
            const name = path.basename(fileName, '.jsx')
            const alias = `${part}${name[0].toUpperCase()}${name.slice(1)}`
            aliases[alias] = `./src/partBarrels/${part}/${name}`
        }
    }

    return aliases
}
