import {
    divide,
    warning,
} from './logger.js'
import {
    isApi,
    isHeadlessPanel,
    isPanel,
    isSite,
    isWorker,
    replaceVariables,
} from './os.js'
import {
    runStreaming,
} from './terminal.js'

export default async params => {
    params.containerFile = `/tmp/build/container`
    divide()

    if (isApi(params)) {
        params.sourceContainerFile = 'api'
    } else if (isPanel(params)) {
        if (isHeadlessPanel(params)) {
            params.sourceContainerFile = 'headlessPanel'
        } else {
            params.sourceContainerFile = 'panel'
        }
    } else if (isSite(params)) {
        params.sourceContainerFile = 'site'
    } else if (isWorker(params)) {
        params.sourceContainerFile = 'worker'
    } else {
        warning('Unknown process')
    }
    params.sourceContainerFile = `${params.home}/core/container/files/prod/${params.sourceContainerFile}`

    replaceVariables(params.sourceContainerFile, params.containerFile, params)

    let cmd = `docker --debug build \
-f ${params.containerFile} \
-t ${params.imageName} \
/tmp/build --no-cache --progress=plain`
    runStreaming(cmd)
}
