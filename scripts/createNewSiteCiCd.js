import getApiRepo from './getApiRepo.js'
import isFile from './isFile.js'
import {
    divide,
    success,
} from './logger.js'
import {
    getContent,
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
    content += `\n            - name: Clone new site core\n              if: startsWith(runner.name, 'GitHub')\n              run: |\n                    clone holizm newSite\n`
    const backingRepository = getApiRepo(repo)
    if (backingRepository !== repo) {
        content += `\n            - name: Clone backing runnable\n              if: startsWith(runner.name, 'GitHub')\n              run: |\n                    clone ${params.org} ${backingRepository}\n`
    }
    if (params.siteContentSource && params.siteContentSource.repository !== repo) {
        content += `\n            - name: Clone site content\n              if: startsWith(runner.name, 'GitHub')\n              run: |\n                    clone holizm ${params.siteContentSource.repository}\n`
    }
    const actionFile = `${home}/core/ciCd/${processType}`
    content += replaceVariables(actionFile, params)
    // content += replaceVariables(`${home}/core/ciCd/printCompose`, params)
    // content += replaceVariables(`${home}/core/ciCd/printVariables`, params)
    content += replaceVariables(`${home}/core/ciCd/build`, params)
    content += replaceVariables(`${home}/core/ciCd/signIn`, params)
    content += replaceVariables(`${home}/core/ciCd/push`, params)
    content += replaceVariables(`${home}/core/ciCd/signOut`, params)
    content = content.replace(/[ \t]+$/gm, '')

    if (isFile(vcsActionPath) && getContent(vcsActionPath) === content) {
        success('CI/CD is up to date')
        divide()
        return
    }
    writeFile(vcsActionPath, content)

    success('Updated CI/CD')
    divide()
}
