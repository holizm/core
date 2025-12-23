#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const directory = `/${process.env.repo}/${process.env.process}/src/parts/${process.argv[2]}`
const event = process.argv[3]
const file = process.argv[4]

const getDirectoryFiles = dir => {
    try {
        return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile())
    } catch (error) {
        console.log(dir)
    }
}


if (directory.endsWith('pageParts/')) process.exit()

const directoryFiles = getDirectoryFiles(directory)

let content = ''
const fileImports = []
const fileExports = []

for (const file of directoryFiles) {
    if (file !== 'exports.jsx') {
        const fileWithoutExtension = file.replace('.jsx', '')
        fileImports.push(`import ${fileWithoutExtension} from "./${fileWithoutExtension}"\n`)
    }
}

fileImports.sort()

for (const fileImport of fileImports) {
    content += fileImport
}

content += '\n'

for (const file of directoryFiles) {
    if (file !== 'exports.jsx') {
        const fileWithoutExtension = file.replace('.jsx', '')
        fileExports.push(`export { ${fileWithoutExtension} }\n`)
    }
}

fileExports.sort()

for (const fileExport of fileExports) {
    content += fileExport
}

const exportsPath = `${directory}/exports.jsx`

if (fs.existsSync(exportsPath)) {
    const existingContent = fs.readFileSync(exportsPath, 'utf8')
    if (existingContent === content) {
        console.log('exports.jsx is up-to-date.')
    } else {
        // console.log(`Updating the exports.jsx of ${directory} ...`)
        fs.writeFileSync(exportsPath, content)
    }
} else {
    // console.log(`Updating the exports.jsx of ${directory} ...`)
    fs.writeFileSync(exportsPath, content)
}

