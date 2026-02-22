import { warning } from './logger.js'
import {
    getFileContent,
    isDir,
    isFile,
} from './os.js'

export default params => {
    const {
        composeFile,
    } = params

    const content = getFileContent(composeFile)

    const volumeRegex = /^\s*-\s*([^:\n]+):([^:\n]+)/gm
    const matches = [...content.matchAll(volumeRegex)]

    matches.forEach(match => {
        const left = match[1].trim()

        const fileExists = isFile(left)
        const dirExists = isDir(left)

        if (!fileExists && !dirExists) {
            warning(left)
        }
    })
}
