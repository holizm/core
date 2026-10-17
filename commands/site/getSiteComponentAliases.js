import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import addNamedSiteAliases from './addNamedSiteAliases.js'
import writeSiteComponentBarrel from './writeSiteComponentBarrel.js'

const getSiteComponentAliases = (srcBase, absolute = false) => {
    const directories = [
        'core',
        'coreContexts',
        'coreFunctions',
        'coreGetters',
        'coreHooks',
        'coreLoaders',
        'coreParts',
        'functions',
        'getters',
        'loaders',
        'pageParts',
        'themes',
    ]
    const files = fg.sync([
        ...directories.map(directory => `${directory}/**/*.{js,jsx,ts,tsx}`),
        'themes/**/*.json',
        'document*.jsx',
        'siteConfiguration.js',
    ], {
        cwd: srcBase,
        dot: false,
        onlyFiles: true,
    }).sort()
    const aliases = {}
    const namedAliases = []

    for (const file of files) {
        const extension = path.extname(file)
        const modulePath = file.slice(0, -extension.length)
        const source = fs.readFileSync(path.join(srcBase, file), 'utf8')
        const isData = extension === '.json'
        const hasDefault = isData || /\bexport\s+default\b/.test(source)
        const segments = modulePath.split(path.sep)
        const owned = ['pageParts', 'themes'].includes(segments[0])
        const ownedSegments = segments[1] === 'sharedFallbacks'
            ? ['shared', ...segments.slice(2)]
            : segments.slice(1)
        const name = owned
            ? ownedSegments.map((segment, index) => index === 0 && segments[0] === 'themes'
                ? `theme${segment}`
                : segment[0].toUpperCase() + segment.slice(1)).join('')
            : path.basename(modulePath)
        const names = new Set([name])
        if (!owned) {
            for (const match of source.matchAll(/\bexport\s+(?:const|let|var|class|(?:async\s+)?function)\s+([\w$]+)/g)) {
                namedAliases.push([match[1], file])
            }
            for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
                for (const specifier of match[1].split(',')) {
                    const named = specifier.trim().split(/\s+as\s+/).pop()
                    if (named) namedAliases.push([named, file])
                }
            }
        }
        const defaultName = source.match(/\bexport\s+default\s+([\w$]+)\b/)?.[1]
        if (!owned && defaultName && source.includes(`const ${defaultName}`)) names.add(defaultName)

        if (!isData) writeSiteComponentBarrel({
            barrelFile: path.join(srcBase, 'coreBarrels', file),
            hasDefault,
            sourceFile: path.join(srcBase, file),
        })
        const aliasPath = isData
            ?
            file
            :
            path.join('coreBarrels', modulePath)
        const target = absolute ? path.join(srcBase, aliasPath) : `./src/${aliasPath}`
        for (const name of names) {
            if (owned && !hasDefault) continue
            const alias = name[0].toLowerCase() + name.slice(1)
            if (!owned && segments.length > 1) aliases[`${segments[0]}${name[0].toUpperCase()}${name.slice(1)}`] ||= target
            aliases[`core${name[0].toUpperCase()}${name.slice(1)}`] ||= target
            if (fs.existsSync(path.join(srcBase, 'parts', alias))) continue
            if (fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))) continue
            aliases[alias] ||= target
        }
    }

    addNamedSiteAliases({
        absolute,
        aliases,
        namedAliases,
        srcBase,
    })

    for (const name of ['themeHeads', 'themeIndexes', 'themeLayouts', 'themeStyles']) {
        if (!fs.existsSync(path.join(srcBase, name, 'index.jsx'))) continue
        aliases[name] = absolute
            ? path.join(srcBase, name)
            : `./src/${name}`
    }

    return aliases
}

export default getSiteComponentAliases
