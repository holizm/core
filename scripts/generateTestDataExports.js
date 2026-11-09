import path from 'path'
import { pathToFileURL } from 'url'
import fg from 'fast-glob'
import camelize from './camelize.js'
import { writeFile } from './os.js'

export default async ({
    home,
    outputDirectory,
}) => {
    const aliases = {}
    const dataDirectory = path.join(home, 'testData')
    const directories = await fg('*', {
        cwd: dataDirectory,
        onlyDirectories: true,
    })
    for (const directory of directories.sort()) {
        const part = directory
        const root = path.join(dataDirectory, part)
        const files = await fg('**/*.js', {
            cwd: root,
            ignore: ['**/*Test.js', '**/*Tests.js', '**/node_modules/**'],
        })
        const names = new Set()
        const exports = files.sort().map(file => {
            const name = camelize(file.replace(/\.js$/, '').replaceAll('/', ' '))
            if (names.has(name)) throw new Error(`Duplicate test data export: ${part}.${name}`)
            names.add(name)
            const source = pathToFileURL(path.join(root, file)).href
            return `export { default as ${name} } from '${source}'`
        })
        const barrel = path.join(outputDirectory, `${part}TestData.mjs`)
        writeFile(barrel, `${exports.join('\n')}\n`)
        aliases[`${part}TestData`] = pathToFileURL(barrel).href
    }
    return aliases
}
