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

    params.addVolume(`${home}/${processType}/package.json`, `/${repo}/${process}/corePackage.json`)
    if (hasCustomPackages) {
        params.addVolume(`${packageJson}`, `/${repo}/${process}/${processType}.json`)
        params.addVolume(`/tmp/${repo}/${process}/nodeModules`, `/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${repo}/common/${processType}Lock.json`, `/${repo}/${process}/package-lock.json`)
        writeFileIfNotExists(lock, '{}')
        params.nodeModules = `/${repo}/${process}/node_modules`
    }
    else {
        params.addVolume(`/tmp/nodeModules`, `/${repo}/${process}/node_modules`)
        params.addVolume(`${home}/${processType}/lock.json`, `/${repo}/${process}/package-lock.json`)
        params.nodeModules = `/${repo}/${process}/node_modules`
    }
}
