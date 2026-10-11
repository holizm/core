import path from 'path'
import isControlPanel from './isControlPanel.js'
import isProcess from './isProcess.js'

export default params => isProcess(params)
    && Boolean(path.basename(params.processPath).includes('Panel') || isControlPanel(params))
