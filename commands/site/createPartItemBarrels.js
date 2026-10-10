#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const part = process.argv[2]
const srcBase = path.join(process.env.home, process.env.repo, process.env.process, 'src')
const exportsPath = path.join(srcBase, 'parts', part, 'exports.jsx')
const barrelDirectory = path.join(srcBase, 'partBarrels', part)
const source = fs.readFileSync(exportsPath, 'utf8')
const entries = [...source.matchAll(/^import (\w+) from '(.+)'$/gm)].map(([, name, sourcePath]) => {
    const fileName = `${name[0].toLowerCase()}${name.slice(1)}.jsx`
    const sourceFile = path.join(srcBase, 'parts', part, sourcePath)
    const relativePath = path.relative(barrelDirectory, sourceFile).replaceAll(path.sep, '/')
    const specifier = relativePath.startsWith('.') ? relativePath : `./${relativePath}`
    return [fileName, `export { default } from '${specifier}'\n`]
})

if (source.includes('const Layout = null')) {
    entries.push(['layout.jsx', 'export default null\n'])
}

fs.mkdirSync(barrelDirectory, { recursive: true })
for (const [fileName, content] of entries) {
    const target = path.join(barrelDirectory, fileName)
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === content) continue
    fs.writeFileSync(target, content)
}
