import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'

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
        const hasDefault = /\bexport\s+default\b/.test(source)
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
                namedAliases.push([match[1], modulePath])
            }
            for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
                for (const specifier of match[1].split(',')) {
                    const named = specifier.trim().split(/\s+as\s+/).pop()
                    if (named) namedAliases.push([named, modulePath])
                }
            }
        }
        const defaultName = source.match(/\bexport\s+default\s+([\w$]+)\b/)?.[1]
        if (!owned && defaultName && source.includes(`const ${defaultName}`)) names.add(defaultName)

        const barrelFile = path.join(srcBase, 'coreBarrels', file)
        const relativeSource = path.relative(path.dirname(barrelFile), path.join(srcBase, file)).replaceAll(path.sep, '/')
        const specifier = relativeSource.startsWith('.') ? relativeSource : `./${relativeSource}`
        const content = `${hasDefault ? `export { default } from '${specifier}'\n` : ''}export * from '${specifier}'\n`
        fs.mkdirSync(path.dirname(barrelFile), { recursive: true })
        fs.writeFileSync(barrelFile, content)

        const aliasPath = path.join('coreBarrels', modulePath)
        const target = absolute ? path.join(srcBase, aliasPath) : `./src/${aliasPath}`
        for (const name of names) {
            if (owned && !hasDefault) continue
            const alias = name[0].toLowerCase() + name.slice(1)
            const prefixed = `core${name[0].toUpperCase()}${name.slice(1)}`
            if (!owned && segments.length > 1) aliases[`${segments[0]}${name[0].toUpperCase()}${name.slice(1)}`] ||= target
            aliases[prefixed] ||= target
            if (fs.existsSync(path.join(srcBase, 'parts', alias))) continue
            if (fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))) continue
            aliases[alias] ||= target
        }
    }

    for (const [name, modulePath] of namedAliases) {
        const alias = name[0].toLowerCase() + name.slice(1)
        const targetPath = path.join('coreBarrels', modulePath)
        const target = absolute ? path.join(srcBase, targetPath) : `./src/${targetPath}`
        aliases[`core${name[0].toUpperCase()}${name.slice(1)}`] ||= target
        if (fs.existsSync(path.join(srcBase, 'parts', alias))) continue
        if (fs.existsSync(path.join(srcBase, 'pageParts', `${alias}Exports.jsx`))) continue
        aliases[alias] ||= target
    }

    for (const name of ['themeHeads', 'themeIndexes', 'themeLayouts', 'themeStyles']) {
        if (!fs.existsSync(path.join(srcBase, name, 'index.jsx'))) continue
        aliases[name] = absolute
            ? path.join(srcBase, name)
            : `./src/${name}`
    }

    return aliases
}

export default getSiteComponentAliases
