import getApiRepo from './getApiRepo.js';
import isDir from './isDir.js';
import isFile from './isFile.js';
import mapTesting from './mapTesting.js';
import { writeFileIfNotExists } from './os.js';
export default params => {
    mapTesting(params);
    const {
        containerHome,
        home,
        process,
        processType,
        repo
    } = params;
    const coreRepository = params.coreRepository || processType;
    const packageJson = params[`${processType}PackageJson`];
    const lock = params[`${processType}Lock`];
    const hasCustomPackages = isFile(packageJson);
    const installedNodeModules = processType === 'api' ? `${containerHome}/${repo}/node_modules` : `${containerHome}/${repo}/${process}/node_modules`;
    let installedNodeModulesSource;
    params.addVolume(`${home}/${coreRepository}/package.json`, `${containerHome}/${repo}/${process}/corePackage.json`);
    if (hasCustomPackages) {
        params.addVolume(`${packageJson}`, `${containerHome}/${repo}/${process}/${processType}.json`);
        installedNodeModulesSource = `/var/tmp/${repo}/${processType}/nodeModules`;
        params.addVolume(`${home}/${repo}/common/${processType}Lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`);
        writeFileIfNotExists(lock, '{}');
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`;
    } else {
        installedNodeModulesSource = `/var/tmp/${coreRepository}/nodeModules`;
        params.addVolume(`${home}/${coreRepository}/lock.json`, `${containerHome}/${repo}/${process}/package-lock.json`);
        params.nodeModules = `${containerHome}/${repo}/${process}/node_modules`;
    }
    params.addVolume(installedNodeModulesSource, installedNodeModules);
    if (processType !== 'api') {
        for (const dependency of params.dependencies || []) {
            const roots = [`${home}/${repo}/${dependency}`, `${home}/${getApiRepo(repo)}/${dependency}`, `${home}/${dependency}`];
            const root = roots.find(root => isFile(`${root}/part`) && isDir(`${root}/functions`));
            if (root) params.addVolume(`${root}/functions`, `${containerHome}/${repo}/${process}/clientFunctions/${dependency}:ro`);
        }
    }
    if (processType === 'api') {
        params.addVolume(installedNodeModulesSource, `${containerHome}/node_modules`);
    }
};
