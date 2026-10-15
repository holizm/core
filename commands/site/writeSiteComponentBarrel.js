import fs from 'fs'
import path from 'path'

export default ({
    barrelFile,
    hasDefault,
    sourceFile,
}) => {
    const relativeSource = path.relative(path.dirname(barrelFile), sourceFile).replaceAll(path.sep, '/')
    const specifier = relativeSource.startsWith('.')
        ?
        relativeSource
        :
        `./${relativeSource}`
    const defaultExport = hasDefault
        ?
        `export { default } from '${specifier}'\n`
        :
        ''
    const content = `${defaultExport}export * from '${specifier}'\n`
    fs.mkdirSync(path.dirname(barrelFile), { recursive: true })
    fs.writeFileSync(barrelFile, content)
}
