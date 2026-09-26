import fs from 'fs'
import path from 'path'
import isProcess from './isProcess.js'

export default params => {
    if (!isProcess(params)) return false

    const folder = path.basename(params.processPath).toLowerCase()
    const hasSite = folder.includes('site')
    const hasApi = folder.includes('api')
    const hasAppDir = fs.existsSync(path.join(params.processPath, 'pages'))
    return (hasSite && !hasApi) || hasAppDir
}
