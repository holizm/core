import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'

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
        const sourceDirectory = path.join(srcBase, 'parts', part)
        const files = fg.sync('**/*.{js,jsx,ts,tsx}', {
            cwd: sourceDirectory,
            onlyFiles: true,
        })
        for (const file of files) {
            if (path.basename(file).startsWith('exports.')) continue
            const sourcePath = path.join(sourceDirectory, file)
            const source = fs.readFileSync(sourcePath, 'utf8')
            if (!/\bexport\s+default\b/.test(source)) continue
            const extension = path.extname(file)
            const segments = file.slice(0, -extension.length).split(path.sep)
            if (['parts', 'functions', 'getters', 'loaders'].includes(segments[0])) segments.shift()
            const name = segments.map((segment, index) => index === 0
                ? segment
                : segment[0].toUpperCase() + segment.slice(1)).join('')
            const barrelPath = path.join(partDirectory, `${name}.jsx`)
            const relativePath = path.relative(partDirectory, sourcePath).replaceAll(path.sep, '/')
            const specifier = relativePath.startsWith('.') ? relativePath : `./${relativePath}`
            const content = `export { default } from '${specifier}'\n`
            if (!fs.existsSync(barrelPath) || fs.readFileSync(barrelPath, 'utf8') !== content) {
                fs.writeFileSync(barrelPath, content)
            }
            const alias = `${part}${name[0].toUpperCase()}${name.slice(1)}`
            aliases[alias] ||= `./src/partBarrels/${part}/${name}`
        }
    }

    return aliases
}
