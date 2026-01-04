import { isFile } from './os.js'

export default params => {
    let {
        home,
        process,
        repo,
        processType,
    } = params
    const packageJson = params[`${processType}PackageJson`]
    const lock = params[`${processType}Lock`]
    const hasCustomPackages = isFile(packageJson)

    params.addVolume(`${home}/${processType}/package.json`, `${home}/${repo}/${process}/corePackage.json`)
    if (hasCustomPackages) {
        params.addVolume(`${packageJson}`, `${home}/${repo}/${process}/${processType}.json`)
        params.addVolume(`/var/tmp/${repo}/${processType}/nodeModules`, `${home}/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${repo}/common/${processType}Lock.json`, `${home}/${repo}/${process}/package-lock.json`)
        writeFileIfNotExists(lock, '{}')
        params.nodeModules = `${home}/${repo}/${process}/node_modules`
    }
    else {
        params.addVolume(`/var/tmp/${processType}/nodeModules`, `${home}/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${processType}/lock.json`, `${home}/${repo}/${process}/package-lock.json`)
        params.nodeModules = `${home}/${repo}/${process}/node_modules`
    }
}
