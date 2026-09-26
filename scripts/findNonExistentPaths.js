import isDir from './isDir.js'
import isFile from './isFile.js'
import { warning } from './logger.js'
import { getContent } from './os.js'

export default params => {
    const {
        composeFile,
    } = params

    const content = getContent(composeFile)

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
