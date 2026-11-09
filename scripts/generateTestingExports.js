import path from 'path'
import { pathToFileURL } from 'url'
import fg from 'fast-glob'
import camelize from './camelize.js'
import isDir from './isDir.js'
import { writeFile } from './os.js'

export default async ({
    home,
    outputDirectory,
}) => {
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
        const exports = files.sort().map(file => {
            const name = camelize(file.replace(/\.js$/, '').replaceAll('/', ' '))
            if (names.has(name)) throw new Error(`Duplicate test support export: ${part}.${name}`)
            names.add(name)
            const source = pathToFileURL(path.join(root, file)).href
            return `export { default as ${name} } from '${source}'`
        })
        const barrel = path.join(outputDirectory, `${part}Testing.mjs`)
        writeFile(barrel, `${exports.join('\n')}\n`)
        aliases[`${part}Testing`] = pathToFileURL(barrel).href
    }
    return aliases
}
