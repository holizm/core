import copy from "./copy.js"
import getDependencies from "./getDependencies.js"
import { info } from './logger.js'
import { createDirIfNotExists } from './os.js'

export default params => {
    const {
        org,
        repo,
        process,
    } = params
    info('Copying dependencies ...')
    createDirIfNotExists(`/tmp/build/${repo}/${process}`)
    const dependencies = getDependencies(params)
    for (const dependency of dependencies) {
        copy({ ...params, directory: dependency })
    }
}
