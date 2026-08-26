import fs from 'fs'
import {
    dirname,
    extname,
} from 'path'

export default targetPath => {
    const pathIsFile = extname(targetPath) !== ''
    const directoryPath =
        pathIsFile
        ?
        dirname(targetPath)
        :
        targetPath

    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true })
    }

    if (pathIsFile && !fs.existsSync(targetPath)) {
        fs.closeSync(fs.openSync(targetPath, 'w'))
    }
}
