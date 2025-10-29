import {
    divide,
    success,
} from './logger.js'
import {
    getFileContent,
    replaceEnvs,
    replaceEnvsAndAppend,
    writeFile,
} from './os.js'

export default params => {
    const {
        home,
        processType,
        repo,
        lowercaseOrg,
        lowercaseRepo,
        lowercaseProcess,
        process,
    } = params

    divide()

    const gitHubActionPath = `${home}/${repo}/.github/workflows/${process}.yml`
    replaceEnvs(`${home}/core/ciCd/base`, gitHubActionPath, params)
    const actionFile = `${home}/core/ciCd/${processType}`
    replaceEnvsAndAppend(actionFile, gitHubActionPath, params)
    replaceEnvsAndAppend(`${home}/core/ciCd/repo`, gitHubActionPath, params)
    replaceEnvsAndAppend(`${home}/core/ciCd/buildSignInPushSignOut`, gitHubActionPath, params)

    const dockerImageName = `${lowercaseOrg}/${lowercaseRepo}/${lowercaseProcess}`
    let content = getFileContent(gitHubActionPath)
    content = content.replace(/dockerImageNamePlaceHolder/g, dockerImageName)
    writeFile(gitHubActionPath, content)

    success('Created GitHub action')
    divide()
}
