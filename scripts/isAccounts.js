import path from 'path'
import isProcess from './isProcess.js'

export default params => isProcess(params) && path.basename(params.processPath) === 'accounts'
