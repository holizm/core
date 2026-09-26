import fs from 'fs'
import path from 'path'
import isPanel from './isPanel.js'

export default params => isPanel(params) && fs.existsSync(path.join(params.processPath, 'headless'))
