import { isFile } from './os.js'
import indentation from './indentation.js'

export default params => {
    let {
        home,
        process,
        repo,
        type,
        volumes,
    } = params
    const packageJson = params[`${type}PackageJson`]
    const lock = params[`${type}Lock`]

    if (isFile(packageJson)) {
        volumes += `\n${indentation}- ${packageJson}:/${repo}/${process}/${type}.json`
        volumes += `\n${indentation}- /tmp/${repo}/${process}/nodeModules:/${repo}/${process}/node_modules`
        volumes += `\n${indentation}- ${home}/${repo}/common/${type}Lock.json:/${repo}/${process}/package-lock.json`
        writeFileIfNotExists(lock, '{}')
    }
    else {
        volumes += `\n${indentation}- /tmp/nodeModules:/${repo}/${process}/node_modules`
        volumes += `\n${indentation}- ${home}/${type}/lock.json:/${repo}/${process}/package-lock.json`
    }
    return volumes
}
