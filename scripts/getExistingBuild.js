import getBuildDirectories from './getBuildDirectories.js'
import getPaths from './getPaths.js'
import isApi from './isApi.js'
import isPanel from './isPanel.js'
import isSite from './isSite.js'

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
