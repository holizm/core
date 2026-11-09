import path from 'path'
import { pathToFileURL } from 'url'
import fg from 'fast-glob'
import {
    init,
    parse,
} from 'es-module-lexer'
import camelize from './camelize.js'
import isDir from './isDir.js'
import {
    getContent,
    writeFile,
} from './os.js'

export default async ({
    home,
    outputDirectory,
}) => {
    await init
    const aliases = {}
    const dataDirectory = path.join(home, 'testing')
    const directories = await fg('*', {
        cwd: dataDirectory,
        onlyDirectories: true,
    })
    const roots = new Map(directories.sort().map(part => [part, path.join(dataDirectory, part)]))
    const markers = await fg(['*/part', '*/*/part'], { cwd: home })
    for (const marker of markers.sort()) {
        const directory = path.dirname(marker)
        const root = path.join(home, directory, 'testing')
        const part = path.basename(directory)
        if (!roots.has(part) && isDir(root)) roots.set(part, root)
    }
    for (const [part, root] of roots) {
        const files = await fg('**/*.js', {
            cwd: root,
            ignore: ['**/*Test.js', '**/*Tests.js', '**/node_modules/**'],
        })
        const names = new Set()
        const exports = files.sort().flatMap(file => {
            const [, declarations] = parse(getContent(path.join(root, file)))
            if (!declarations.length) return []
            const name = camelize(file.replace(/\.js$/, '').replaceAll('/', ' '))
            if (names.has(name)) throw new Error(`Duplicate test support export: ${part}.${name}`)
            names.add(name)
            const source = pathToFileURL(path.join(root, file)).href
            const binding = declarations.some(item => (item.name ?? item.n) === 'default')
                ? `{ default as ${name} }`
                : `* as ${name}`
            return `export ${binding} from '${source}'`
        })
        const barrel = path.join(outputDirectory, `${part}Testing.mjs`)
        writeFile(barrel, `${exports.join('\n')}\n`)
        aliases[`${part}Testing`] = pathToFileURL(barrel).href
    }
    return aliases
}
