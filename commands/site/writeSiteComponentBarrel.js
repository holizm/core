import fs from 'fs'
import path from 'path'

export default ({
    barrelFile,
    hasDefault,
    namedExport,
    sourceFile,
}) => {
    const relativeSource = path.relative(path.dirname(barrelFile), sourceFile).replaceAll(path.sep, '/')
    const specifier = relativeSource.startsWith('.')
        ?
        relativeSource
        :
        `./${relativeSource}`
    const exportedName = namedExport ? `${namedExport} as default` : 'default'
    const defaultExport = hasDefault || namedExport
        ?
        `export { ${exportedName} } from '${specifier}'\n`
        :
        ''
    const content = `${defaultExport}export * from '${specifier}'\n`
    if (fs.existsSync(barrelFile) && fs.readFileSync(barrelFile, 'utf8') === content) return
    fs.mkdirSync(path.dirname(barrelFile), { recursive: true })
    fs.writeFileSync(barrelFile, content)
}
