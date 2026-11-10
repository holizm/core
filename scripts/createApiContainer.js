import getProcessComposeSettings from './getProcessComposeSettings.js'
import loadProcessRuntimeSettings from './loadProcessRuntimeSettings.js'
import { replaceVariables } from './os.js'
export default params => {
    const {
        composeFile,
        home,
    } = params
    const composeTemplatePath = `${home}/core/container/composes/api`
    const runtime = loadProcessRuntimeSettings(params)
    const settings = getProcessComposeSettings({
        isBuild: params.isCiCd || params.localBuild,
        port: params.deterministicPort,
        runtime,
    })
    replaceVariables(composeTemplatePath, composeFile, {
        ...params,
        ...settings,
    })
}
