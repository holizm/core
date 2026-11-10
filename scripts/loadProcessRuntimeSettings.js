import getProcessRuntimeSettings from './getProcessRuntimeSettings.js'
import isFile from './isFile.js'
import { getContent } from './os.js'

export default params => {
    const processPath = params.processPath || (params.home && params.repo && params.process
        ? [params.home, params.repo, params.process].join('/')
        : '')
    const runtime = getProcessRuntimeSettings({
        processPath,
        readContent: file => processPath && isFile(file) ? getContent(file) : '',
    })
    return runtime
}
