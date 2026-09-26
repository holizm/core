import isFile from './isFile.js'
import { getContent } from './os.js'

export default ({ privateSettingsPath }) => isFile(privateSettingsPath)
    && JSON.parse(getContent(privateSettingsPath)).isControl === true
