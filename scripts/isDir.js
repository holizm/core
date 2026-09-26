import fs from 'fs'

export default path => path && fs.existsSync(path) && fs.statSync(path).isDirectory()
