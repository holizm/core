import { isFile } from './os.js'
import indentation from './indentation.js'

export default params => {
    let {
        home,
        process,
        repo,
        processType,
    } = params
    const packageJson = params[`${processType}PackageJson`]
    const lock = params[`${processType}Lock`]

    params.volumes += `\n${indentation}- ${home}/${processType}/package.json:/${repo}/${process}/corePackage.json`
    if (isFile(packageJson)) {
        params.volumes += `\n${indentation}- ${packageJson}:/${repo}/${process}/${processType}.json`
        params.volumes += `\n${indentation}- /tmp/${repo}/${process}/nodeModules:/${repo}/${process}/node_modules`
        params.volumes += `\n${indentation}- ${home}/${repo}/common/${processType}Lock.json:/${repo}/${process}/package-lock.json`
        writeFileIfNotExists(lock, '{}')
    }
    else {
        params.volumes += `\n${indentation}- /tmp/nodeModules:/${repo}/${process}/node_modules`
        params.volumes += `\n${indentation}- ${home}/${processType}/lock.json:/${repo}/${process}/package-lock.json`
    }
}
