import { replaceVariables } from './os.js'
import { measure } from './timing.js'

export default params => {
    const {
        composeFile,
        home,
    } = params
    const composeTemplatePath = `${home}/core/container/composes/multiThemedSite`
    measure('multi-themed site: create Compose file', () => replaceVariables(composeTemplatePath, composeFile, params))
}
