import fs from 'fs'
import path from 'path'

const getSiteComponentAliases = (srcBase, absolute = false) => {
    const source = fs.readFileSync(path.join(srcBase, 'core', 'exports.jsx'), 'utf8')
    const aliases = {}
    const imports = source.matchAll(/import\s+(\w+|\{[^}]+\})\s+from\s+'([^']+)'/g)
    const exports = source.matchAll(/export\s+\{([^}]+)\}\s+from\s+'([^']+)'/g)

    for (const match of [...imports, ...exports]) {
        if (!match[2].startsWith('.')) continue
        const modulePath = path.normalize(path.join('core', match[2])).replace(/\.(jsx|js)$/, '')
        const names = match[1].startsWith('{') || match[0].startsWith('export')
            ?
            match[1].replace(/[{}]/g, '').split(',').map(name => name.trim().split(/\s+as\s+/).pop())
            :
            [match[1]]

        for (const name of names.filter(Boolean)) {
            const alias = name[0].toLowerCase() + name.slice(1)
            const sourcePath = absolute ? path.join(srcBase, modulePath) : `./src/${modulePath}`
            aliases[`core${name[0].toUpperCase()}${name.slice(1)}`] = sourcePath
            if (fs.existsSync(path.join(srcBase, 'parts', alias))) continue
            if (fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))) continue
            aliases[alias] = sourcePath
        }
    }

    return aliases
}

export default getSiteComponentAliases
