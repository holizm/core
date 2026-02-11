import copyDependencies from './copyDependencies.js'
import copy from './copy.js'
import { replaceVariables } from './os.js'
import removeVcsDirectories from './removeVcsDirectories.js'

export default params => {
    const {
        buildPath,
        containerPath,
        home,
        repo,
    } = params
    copy({ ...params, directory: 'core' })
    copy({ ...params, directory: 'fonts' })
    copy({ ...params, directory: 'api' })
    copy({ ...params, directory: 'cloud' })
    copyDependencies({ ...params })
    copy({ ...params, directory: repo })
    replaceVariables(`${home}/core/scripts/apiBuildScript.js`, `${buildPath}/buildScript.js`, params)
    removeVcsDirectories(params)
    replaceVariables(`${home}/core/container/files/prod/api`, `${buildPath}/container`, params)
}
