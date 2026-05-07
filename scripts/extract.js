import path from 'path'
import process from 'process'
import {
    errorAndExit,
    info,
    success,
} from '../scripts/logger.js'
import {
    getDepth,
    getOrgRepoFromGit,
} from '../scripts/os.js'
import pascalize from '../scripts/pascalize.js'
import camelize from '../scripts/camelize.js'

const getOrgRepoFromDir = dir => {
    const parts = dir.split('/')
    const repo = parts[3]
    return {
        org: 'na',
        repo,
    }
}

export default params => {
    const {
        container,
    } = params || {}
    const cwd = process.cwd()
    if (cwd === '/') {
        errorAndExit('Can not run command from the root directory')
    }
    const home = process.env.HOME
    if (cwd === home) {
        errorAndExit('Can not run command from the home directory')
    }

    const {
        org,
        repo,
    } = container
            ?
            getOrgRepoFromDir(cwd)
            :
            getOrgRepoFromGit()

    if (org?.toLowerCase() === 'holizm') {
        errorAndExit('This command is not available for holizm repos. They are not executable/runnable. Run command command from a runnable project.')
    }

    if (org[0] !== org[0].toLowerCase() && camelize(org) !== 'holismProjects')
        errorAndExit('Invalid Organization. Organization name should start with a lowercase letter.', org)

    const depth = getDepth()

    const invalidDepthMessage = 'This command should only be run from inside a process (API, panel, site, worker, etc.)'

    if (container && depth !== 3) {
        errorAndExit(invalidDepthMessage, cwd, process.argv)
    }

    if (!container && depth !== 4) {
        errorAndExit(invalidDepthMessage, cwd)
    }

    params = {
        ...params,
        home,
        containerHome: '/home/dev',
        org,
        repo,
    }

    params.process = path.basename(cwd)
    params.camelizedProcess = camelize(params.process)
    params.pascalizedProcess = pascalize(params.process)
    params.lowercaseOrg = org.toLowerCase()
    params.lowercaseRepo = repo.toLowerCase()
    params.pascalizedRepo = pascalize(repo)
    params.camelizedRepo = camelize(repo)
    params.lowercaseProcess = params.process.toLowerCase()

    success(`organization: ${org}`)
    success(`repository: ${repo}`)
    success(`process: ${params.process}`)

    return params
}
