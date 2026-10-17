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
    for (const [name, file] of namedAliases) {
        const alias = name[0].toLowerCase() + name.slice(1)
        const coreAlias = `core${name[0].toUpperCase()}${name.slice(1)}`
        const publicAliasAvailable = !fs.existsSync(path.join(srcBase, 'parts', alias))
            && !fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))
        if (aliases[coreAlias] && (!publicAliasAvailable || aliases[alias])) continue
        const targetPath = path.join('coreNamedBarrels', alias)
        writeSiteComponentBarrel({
            barrelFile: path.join(srcBase, `${targetPath}.js`),
            namedExport: name,
            sourceFile: path.join(srcBase, file),
        })
        const target = absolute ? path.join(srcBase, targetPath) : `./src/${targetPath}`
        aliases[coreAlias] ||= target
        if (publicAliasAvailable) aliases[alias] ||= target
    }
}
