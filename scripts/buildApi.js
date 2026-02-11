import copyDependencies from './copyDependencies.js'
import copy from './copy.js'
import { replaceVariables } from './os.js'
import removeVcsDirectories from './removeVcsDirectories.js'

export default params => {
    copy({ ...params, directory: 'core' })
    copy({ ...params, directory: 'fonts' })
    copy({ ...params, directory: 'api' })
    copy({ ...params, directory: 'cloud' })
    copyDependencies({ ...params })
    copy({ ...params, directory: params.repo })
    replaceVariables(`${home}/core/scripts/apiBuildScript.js`, params.buildPath, params)
    removeVcsDirectories(params)
    replaceVariables(params.containerPath)
}
/*

function BuildNodeApi() {
    export PATH = '${PATH}'

    envsubst < /HolismHolding/Docker / Files / Prod / NodeApi > $Containerfile
}

*/
