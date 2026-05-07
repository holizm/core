import { isFile } from './os.js'

export default params => {
    let {
        containerHome,
        home,
        process,
        repo,
        processType,
    } = params
    const packageJson = params[`${processType}PackageJson`]
    const lock = params[`${processType}Lock`]
    const hasCustomPackages = isFile(packageJson)

    params.addVolume(`${home}/${processType}/package.json`, `${containerHome}/${repo}/${process}/corePackage.json`)
    if (hasCustomPackages) {
        params.addVolume(`${packageJson}`, `${containerHome}/${repo}/${process}/${processType}.json`)
        params.addVolume(`/var/tmp/${repo}/${processType}/nodeModules`, `${containerHome}/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${repo}/common/${processType}Lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`)
        writeFileIfNotExists(lock, '{}')
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`
    }
    else {
        params.addVolume(`/var/tmp/${processType}/nodeModules`, `${containerHome}/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${processType}/lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`)
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`
    }
}
