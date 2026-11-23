import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'

export default srcBase => {
    const functions = path.resolve(srcBase, '../clientFunctions')
    const files = fs.existsSync(functions)
        ? fg.sync('*/siteConfig.js', { cwd: functions }).sort()
        : []
    const names = files.map(file => `configure${path.dirname(file).replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (match, prefix, letter) => letter.toUpperCase())}`)
    const imports = files.map((file, index) => `import ${names[index]} from '../clientFunctions/${file}'`)
    const content = [
        ...imports,
        '',
        'let configured = false',
        '',
        'const configureSiteParts = () => {',
        '    if (configured) return',
        ...names.map(name => `    ${name}()`),
        '    configured = true',
        '}',
        '',
        'configureSiteParts()',
        'export default configureSiteParts',
        '',
    ].join('\n').trimStart()
    const destination = path.join(srcBase, 'sitePartConfiguration.js')
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== content) {
        fs.writeFileSync(destination, content)
    }
}
