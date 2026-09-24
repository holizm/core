import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import pascalize from '../../scripts/pascalize.js'

const find = args => execFileSync('find', args, { encoding: 'utf8' })

const writeIfChanged = (filePath, content) => {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
        return
    }
    fs.writeFileSync(filePath, content)
}

const toPosix = value => value.split(path.sep).join('/')

const generateExports = () => {
    const directories = find([
        'src',
        '-mindepth',
        '2',
        '-maxdepth',
        '2',
        '-type',
        'd',
    ])
        .trim()
        .split('\n')
        .filter(Boolean)
        .filter(directory => ![
            'components',
            'contexts',
            'core',
            'hooks',
            'panel',
            'registries',
        ].some(excluded => directory.includes(`/${excluded}/`)))

    const parents = new Set()
    directories.forEach(directory => {
        const directoryName = path.basename(directory)
        const partName = pascalize(directory.split(path.sep)[1])
        const files = find([
            directory,
            '-type',
            'f',
            '-name',
            '*.jsx',
        ])
            .trim()
            .split('\n')
            .filter(Boolean)
        const appActionFiles = files.filter(file => fs.readFileSync(file, 'utf8').includes('AppAction'))
        const lines = files
            .filter(file => !appActionFiles.includes(file))
            .map(file => {
                const relative = `./${directoryName}/${toPosix(path.relative(directory, file)).replace(/\.jsx$/, '')}`
                const relativeParts = relative.replace(/^\.\//, '').split('/')
                const fileName = path.basename(file, '.jsx')
                const typeName =
                    relativeParts.length > 2
                    ?
                    pascalize(relativeParts[1])
                    :
                    ''
                const exportName = `${partName}${typeName}${pascalize(fileName)}`
                const finalExportName =
                    relative.includes('/hooks/')
                    ?
                    `use${exportName}`
                    :
                    exportName
                return `export { default as ${finalExportName} } from '${relative}'`
            })
        writeIfChanged(`${directory}.jsx`, `${lines.join('\n')}\n`)
        parents.add(path.dirname(directory))
    })

    parents.forEach(parent => {
        const modules = fs.readdirSync(parent)
            .filter(file => file.endsWith('.jsx') && file !== 'exports.jsx')
            .map(file => file.replace('.jsx', ''))
        const names = new Map()
        const conflicts = new Map()
        modules.forEach(module => {
            const source = fs.readFileSync(path.join(parent, `${module}.jsx`), 'utf8')
            for (const match of source.matchAll(/^export \{ default as (\w+) \} from /gm)) {
                const name = match[1]
                if (names.has(name)) conflicts.set(name, names.get(name))
                else names.set(name, module)
            }
        })
        const lines = modules.map(module => `export * from './${module}'`)
        conflicts.forEach((module, name) => {
            lines.push(`export { ${name} } from './${module}'`)
        })
        writeIfChanged(path.join(parent, 'exports.jsx'), `${lines.join('\n')}\n`)
    })
}

export default generateExports

if (process.argv[1] === import.meta.filename) {
    process.chdir(`${process.env.home}/${process.env.repo}/${process.env.process}`)
    generateExports()
}
