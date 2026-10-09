import fs from 'fs'
import path from 'path'

const getSiteComponentAliases = (srcBase, absolute = false) => {
    const source = fs.readFileSync(path.join(srcBase, 'core', 'exports.jsx'), 'utf8')
    const aliases = {}
    const modules = new Map()
    const imports = source.matchAll(/import\s+(\w+|\{[^}]+\})\s+from\s+'([^']+)'/g)
    const exports = source.matchAll(/export\s+\{([^}]+)\}\s+from\s+'([^']+)'/g)

    for (const match of [...imports, ...exports]) {
        if (!match[2].startsWith('.')) continue
        const modulePath = path.normalize(path.join('core', match[2])).replace(/\.(jsx|js)$/, '')
        const extension = ['.jsx', '.js', '.tsx', '.ts'].find(value =>
            fs.existsSync(path.join(srcBase, `${modulePath}${value}`))
        )
        if (!extension) continue
        const barrelPath = path.join('coreBarrels', `${modulePath}${extension}`)
        const isDefault = (match[0].startsWith('import') && !match[1].startsWith('{'))
            || /\bdefault\s+as\s+/.test(match[1])
        modules.set(modulePath, (modules.get(modulePath) || false) || isDefault)
        const names = match[1].startsWith('{') || match[0].startsWith('export')
            ?
            match[1].replace(/[{}]/g, '').split(',').map(name => name.trim().split(/\s+as\s+/).pop())
            :
            [match[1]]

        for (const name of names.filter(Boolean)) {
            const alias = name[0].toLowerCase() + name.slice(1)
            const sourcePath = absolute ? path.join(srcBase, barrelPath).replace(/\.[^.]+$/, '') : `./src/${barrelPath.replace(/\.[^.]+$/, '')}`
            aliases[`core${name[0].toUpperCase()}${name.slice(1)}`] = sourcePath
            if (fs.existsSync(path.join(srcBase, 'parts', alias))) continue
            if (fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))) continue
            aliases[alias] = sourcePath
        }
    }

    for (const [modulePath, hasDefault] of modules) {
        const extension = ['.jsx', '.js', '.tsx', '.ts'].find(value =>
            fs.existsSync(path.join(srcBase, `${modulePath}${value}`))
        )
        const barrelFile = path.join(srcBase, 'coreBarrels', `${modulePath}${extension}`)
        const relativeSource = path.relative(path.dirname(barrelFile), path.join(srcBase, `${modulePath}${extension}`)).replaceAll(path.sep, '/')
        const sourceSpecifier = relativeSource.startsWith('.') ? relativeSource : `./${relativeSource}`
        const content = `${hasDefault ? `export { default } from '${sourceSpecifier}'\n` : ''}export * from '${sourceSpecifier}'\n`
        fs.mkdirSync(path.dirname(barrelFile), { recursive: true })
        fs.writeFileSync(barrelFile, content)
    }

    return aliases
}

export default getSiteComponentAliases
