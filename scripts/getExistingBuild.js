import getBuildDirectories from './getBuildDirectories.js'
import getPaths from './getPaths.js'
import {
    isApi,
    isPanel,
    isSite,
} from './os.js'

export default params => {
    const existingBuild = {
        ...params,
        ...getBuildDirectories(params),
        ...getPaths(params),
    }
    existingBuild.isApi = isApi(existingBuild)
    existingBuild.isPanel = isPanel(existingBuild)
    existingBuild.isSite = isSite(existingBuild)
    return existingBuild
}
