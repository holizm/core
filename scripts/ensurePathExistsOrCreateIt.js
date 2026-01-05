import fs from 'fs'
import {
    dirname,
    extname,
} from 'path'

export default path => {

    const isFile = extname(path) !== ''
    const dirPath = isFile ? dirname(path) : path

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }

    if (isFile && !fs.existsSync(path)) {
        fs.closeSync(fs.openSync(path, 'w'))
    }
}
