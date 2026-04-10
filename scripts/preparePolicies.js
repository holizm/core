import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const home = process.env.HOME

const dependencies = [
    'api',
    'panel',
    'site'
]

const installedPackagesRoot = path.resolve(`${home}/policies/node_modules`)

const toExportName = (filePath) =>
    path
        .basename(filePath, '.js')
        .replace(/[^a-zA-Z0-9]/g, '_')

const syncDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true })
    execSync(`rsync -a --delete ${src}/ ${dest}/`)
}

const getJsFiles = (dir) => {
    const output = execSync(`find ${dir} -type f -name '*.js'`).toString()
    return output
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean)
}

const writeIfChanged = (filePath, content) => {
    if (fs.existsSync(filePath)) {
        const current = fs.readFileSync(filePath, 'utf8')
        if (current === content) return
    }
    fs.writeFileSync(filePath, content)
}

const generateIndex = (dir, files, packageName) => {
    const exports = files
        .map(file => {
            const rel = './' + path.relative(dir, file).replace(/\\/g, '/')
            const name = toExportName(file)
            return `export { default as ${name} } from '${rel}'`
        })
        .sort()

    const indexContent = exports.join('\n')

    writeIfChanged(path.join(dir, 'index.js'), indexContent)

    const packageJsonPath = path.join(dir, 'package.json')

    const packageContent = JSON.stringify({
        name: packageName,
        version: '1.0.0',
        type: 'module',
        exports: {
            '.': './index.js'
        }
    }, null, 2)

    writeIfChanged(packageJsonPath, packageContent)
}

fs.mkdirSync(installedPackagesRoot, { recursive: true })

for (const dependency of dependencies) {
    const src = `${home}/${dependency}`
    const dest = `${installedPackagesRoot}/${dependency}`

    syncDir(src, dest)

    const files = getJsFiles(dest)

    generateIndex(dest, files, dependency)

    console.log(`Built module: ${dependency}`)
}
