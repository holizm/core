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
        const module = modules.get(modulePath) || {
            extension,
            hasDefault: false,
            names: new Set(),
        }
        module.hasDefault ||= (match[0].startsWith('import') && !match[1].startsWith('{'))
            || /\bdefault\s+as\s+/.test(match[1])
        if (match[1].startsWith('{') || match[0].startsWith('export')) {
            for (const name of match[1].replace(/[{}]/g, '').split(',')) {
                if (name.trim()) module.names.add(name.trim())
            }
        }
        modules.set(modulePath, module)
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

    for (const [modulePath, module] of modules) {
        const { extension } = module
        const barrelFile = path.join(srcBase, 'coreBarrels', `${modulePath}${extension}`)
        const relativeSource = path.relative(path.dirname(barrelFile), path.join(srcBase, `${modulePath}${extension}`)).replaceAll(path.sep, '/')
        const sourceSpecifier = relativeSource.startsWith('.') ? relativeSource : `./${relativeSource}`
        const names = [...module.names]
        const namedExports = names.length === 1
            ? `export { ${names[0]} } from '${sourceSpecifier}'\n`
            : names.length > 1
                ? `export {\n    ${names.join(',\n    ')},\n} from '${sourceSpecifier}'\n`
                : ''
        const content = `${module.hasDefault ? `export { default } from '${sourceSpecifier}'\n` : ''}${namedExports}`
        fs.mkdirSync(path.dirname(barrelFile), { recursive: true })
        fs.writeFileSync(barrelFile, content)
    }

    return aliases
}

export default getSiteComponentAliases
