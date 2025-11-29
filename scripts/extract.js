import path from "path"
import process from "process"
import {
    errorAndExit,
    success,
} from "../scripts/logger.js"
import {
    getDepth,
    getOrgRepoFromGit,
} from "../scripts/os.js"
import pascalize from "../scripts/pascalize.js"
import camelize from "../scripts/camelize.js"

export default () => {
    const cwd = process.cwd()
    if (cwd === "/") {
        errorAndExit("Can not run command from the root directory")
    }
    const home = process.env.HOME
    if (cwd === home) {
        errorAndExit("Can not run command from the home directory")
    }

    const {
        org,
        repo,
    } = getOrgRepoFromGit()

    if (org?.toLowerCase() === "holizm") {
        errorAndExit("This command is not available for holizm repos. They are not executable/runnable. Run command command from a runnable project.")
    }

    if (org[0] !== org[0].toLowerCase())
        errorAndExit("Invalid Organization. Organization name should start with a lowercase letter.")

    if (getDepth() !== 4) {
        errorAndExit("This command should only be run from inside a process (API, panel, site, worker, etc.)")
    }

    let params = {
        home,
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
