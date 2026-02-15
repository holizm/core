import {
    divide,
    success,
} from './logger.js'
import {
    getFileContent,
    replaceVariables,
    replaceVariablesAndAppend,
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

    const gitHubActionPath = `${home}/${repo}/.github/workflows/${process}.yaml`
    replaceVariables(`${home}/core/ciCd/base`, gitHubActionPath, params)
    const actionFile = `${home}/core/ciCd/${processType}`
    replaceVariablesAndAppend(actionFile, gitHubActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/repo`, gitHubActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/buildSignInPushSignOut`, gitHubActionPath, params)

    const dockerImageName = `${lowercaseOrg}/${lowercaseRepo}/${lowercaseProcess}`
    let content = getFileContent(gitHubActionPath)
    content = content.replace(/dockerImageNamePlaceHolder/g, dockerImageName)
    writeFile(gitHubActionPath, content)

    success('Created CI/CD')
    divide()
}
