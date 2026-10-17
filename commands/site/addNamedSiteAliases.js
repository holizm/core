import fs from 'fs'
import path from 'path'
import writeSiteComponentBarrel from './writeSiteComponentBarrel.js'

export default ({
    absolute,
    aliases,
    namedAliases,
    srcBase,
}) => {
    fs.rmSync(path.join(srcBase, 'coreNamedBarrels'), {
        force: true,
        recursive: true,
    })
    for (const [name, file, hasDefault] of namedAliases) {
        const alias = name[0].toLowerCase() + name.slice(1)
        const coreAlias = `core${name[0].toUpperCase()}${name.slice(1)}`
        const modulePath = file.slice(0, -path.extname(file).length)
        const originalPath = path.join('coreBarrels', modulePath)
        const originalTarget = absolute ? path.join(srcBase, originalPath) : `./src/${originalPath}`
        const needsDefault = !hasDefault && aliases[coreAlias] === originalTarget
        const publicAliasAvailable = !fs.existsSync(path.join(srcBase, 'parts', alias))
            && !fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))
        if (!needsDefault && aliases[coreAlias] && (!publicAliasAvailable || aliases[alias])) continue
        const targetPath = path.join('coreNamedBarrels', alias)
        writeSiteComponentBarrel({
            barrelFile: path.join(srcBase, `${targetPath}.js`),
            namedExport: name,
            sourceFile: path.join(srcBase, file),
        })
        const target = absolute ? path.join(srcBase, targetPath) : `./src/${targetPath}`
        if (needsDefault) {
            for (const name of Object.keys(aliases)) {
                if (aliases[name] === originalTarget) aliases[name] = target
            }
        }
        else {
            aliases[coreAlias] ||= target
            if (publicAliasAvailable) aliases[alias] ||= target
        }
    }
}
