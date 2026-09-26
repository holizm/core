import fs from 'fs'
import path from 'path'

export default params => fs.existsSync(path.join(params.processPath, '.git'))
