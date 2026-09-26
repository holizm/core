import fs from 'fs'
import path from 'path'
import isProcess from './isProcess.js'

export default params => isProcess(params)
    && (fs.existsSync(path.join(params.processPath, 'process.js'))
        || path.basename(params.processPath).endsWith('Api')
        || path.basename(params.processPath) === 'etl')
