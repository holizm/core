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

export const createGitHubAction = params => {
    const {
        actionName,
        repo,
        lowercaseOrg,
        lowercaseRepo,
        lowercaseProcess,
        process,
    } = params

    divide()

    const gitHubActionPath = `${home}/${repo}/.github/workflows/${process}.yml`
    replaceEnvs(`${home}/core/ciCd/base`, gitHubActionPath)
    const actionFile = `${home}/core/ciCd/${actionName}`
    replaceEnvsAndAppend(actionFile, gitHubActionPath)
    replaceEnvsAndAppend(`${home}/core/ciCd/getRepositoryAction`, gitHubActionPath)
    replaceEnvsAndAppend(`${home}/core/ciCd/buildSignInPushSignOut`, gitHubActionPath)

    const dockerImageName = `${lowercaseOrg}/${lowercaseRepo}/${lowercaseProcess}`
    let content = getFileContent(gitHubActionPath)
    content = content.replace(/dockerImageNamePlaceHolder/g, dockerImageName)
    writeFile(gitHubActionPath, content)

    success('Created GitHub action')
    divide()
}
