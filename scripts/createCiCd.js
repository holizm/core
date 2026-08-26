import {
    divide,
    success,
} from './logger.js'
import {
    getContent,
    isFile,
    writeFile,
} from './os.js'
import replaceVariables from './replaceVariables.js'

export default params => {
    const {
        home,
        process,
        processType,
        repo,
    } = params

    divide()

    const vcsActionPath = `${home}/${repo}/.github/workflows/${process}.yaml`
    let content = replaceVariables(`${home}/core/ciCd/base`, params)
    content += replaceVariables(`${home}/core/ciCd/initialize`, params)
    content += replaceVariables(`${home}/core/ciCd/extractOrgRepo`, params)
    content += replaceVariables(`${home}/core/ciCd/cloneHolism`, params)
    content += replaceVariables(`${home}/core/ciCd/repo`, params)
    const actionFile = `${home}/core/ciCd/${processType}`
    content += replaceVariables(actionFile, params)
    // content += replaceVariables(`${home}/core/ciCd/printCompose`, params)
    // content += replaceVariables(`${home}/core/ciCd/printVariables`, params)
    content += replaceVariables(`${home}/core/ciCd/build`, params)
    content += replaceVariables(`${home}/core/ciCd/signIn`, params)
    content += replaceVariables(`${home}/core/ciCd/push`, params)
    content += replaceVariables(`${home}/core/ciCd/signOut`, params)

    if (isFile(vcsActionPath) && getContent(vcsActionPath) === content) {
        success('CI/CD is up to date')
        divide()
        return
    }
    writeFile(vcsActionPath, content)

    success('Updated CI/CD')
    divide()
}
