import {
    divide,
    success,
} from './logger.js'
import {
    getContent,
    replaceVariables,
    replaceVariablesAndAppend,
    writeFile,
} from './os.js'

export default params => {
    const {
        home,
        processType,
        repo,
        process,
    } = params

    divide()

    const vcsActionPath = `${home}/${repo}/.github/workflows/${process}.yaml`
    replaceVariables(`${home}/core/ciCd/base`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/initialize`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/extractOrgRepo`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/cloneHolism`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/repo`, vcsActionPath, params)
    const actionFile = `${home}/core/ciCd/${processType}`
    replaceVariablesAndAppend(actionFile, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/start`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/printCompose`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/start`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/getComposedCode`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/copyHolismModules`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/printVariables`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/build`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/signIn`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/push`, vcsActionPath, params)
    replaceVariablesAndAppend(`${home}/core/ciCd/signOut`, vcsActionPath, params)

    let content = getContent(vcsActionPath)
    writeFile(vcsActionPath, content)

    success('Created CI/CD')
    divide()
}
