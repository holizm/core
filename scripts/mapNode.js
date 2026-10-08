import isFile from './isFile.js'
import { writeFileIfNotExists } from './os.js'

export default params => {
    const {
        containerHome,
        home,
        process,
        processType,
        repo,
    } = params
    const packageJson = params[`${processType}PackageJson`]
    const lock = params[`${processType}Lock`]
    const hasCustomPackages = isFile(packageJson)
    const installedNodeModules =
        processType === 'api'
        ?
        `${containerHome}/${repo}/node_modules`
        :
        `${containerHome}/${repo}/${process}/node_modules`
    let installedNodeModulesSource

    const coreRepository = processType === 'site' ? params.siteCore : processType
    params.addVolume(`${home}/${coreRepository}/package.json`, `${containerHome}/${repo}/${process}/corePackage.json`)
    if (hasCustomPackages) {
        params.addVolume(`${packageJson}`, `${containerHome}/${repo}/${process}/${processType}.json`)
        installedNodeModulesSource = `/var/tmp/${repo}/${processType}/nodeModules`
        params.addVolume(`${home}/${repo}/common/${processType}Lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`)
        writeFileIfNotExists(lock, '{}')
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`
    }
    else {
        installedNodeModulesSource = `/var/tmp/${coreRepository}/nodeModules`
        params.addVolume(`${home}/${coreRepository}/lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`)
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`
    }
    params.addVolume(installedNodeModulesSource, installedNodeModules)
    if (processType === 'api') {
        params.addVolume(installedNodeModulesSource, `${containerHome}/node_modules`)
    }
}
