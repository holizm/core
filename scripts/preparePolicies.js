import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const home = process.env.HOME

const dependencies = [
    'api',
    'panel',
    'site',
]

const installedPackagesRoot = path.resolve(`${home}/policies/node_modules`)

const toExportName = (filePath) =>
    path
        .basename(filePath, '.js')
        .replace(/[^a-zA-Z0-9]/g, '_')

const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true })
    execSync(`cp -R ${src}/. ${dest}`)
}

const getJsFiles = (dir) => {
    const output = execSync(`find ${dir} -type f -name *.js`).toString()
    return output
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean)
}

const generateIndex = (dir, files, packageName) => {
    const exports = []

    for (const file of files) {
        const rel = './' + path.relative(dir, file).replace(/\\/g, '/')
        const name = toExportName(file)

        exports.push(`export { default as ${name} } from '${rel}'`)
    }

    fs.writeFileSync(
        path.join(dir, 'index.js'),
        exports.join('\n')
    )

    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({
            name: packageName,
            version: '1.0.0',
            type: 'module',
            exports: {
                '.': './index.js'
            }
        }, null, 2)
    )
}

fs.mkdirSync(installedPackagesRoot, { recursive: true })

for (const dependency of dependencies) {
    const src = `${home}/${dependency}`
    const dest = `${installedPackagesRoot}/${dependency}`

    copyDir(src, dest)

    const files = getJsFiles(dest)

    generateIndex(dest, files, dependency)

    console.log(`Built module: ${dependency}`)
}
