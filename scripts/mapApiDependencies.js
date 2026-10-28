import fs from 'fs';
import getPartApiRolePath from './getPartApiRolePath.js';
import isDir from './isDir.js';
export default params => {
    const {
        containerHome,
        dependencies,
        home,
        isControl,
        nodeModules,
        org,
        process,
        processPath,
        repo
    } = params;
    for (const dependency of dependencies) {
        let runnablePart = false;
        let dependencyOrgOrRep = '';
        if (isDir(`${home}/${repo}/${dependency}`) && dependency !== 'accounts') {
            dependencyOrgOrRep = `/${repo}`;
            runnablePart = true;
        }
        const dependencyRoot = `${home}${dependencyOrgOrRep}/${dependency}`;
        const dependencyBase = `${dependencyRoot}/api`;
        const partFilePath = `${dependencyRoot}/part`;
        if (!fs.existsSync(partFilePath)) {
            continue;
        }
        if (fs.existsSync(dependencyBase)) {
            params.addVolume(`${dependencyBase}`, `${containerHome}/${dependency}/api`);
        }
        params.addVolume(`${partFilePath}`, `${containerHome}/${dependency}/part`);
        if (runnablePart) {
            const localizationDirectories = ['localization', 'panel/localization', 'site/localization'];
            for (const directory of localizationDirectories) {
                const source = `${dependencyRoot}/${directory}`;
                if (fs.existsSync(source)) {
                    params.addVolume(source, `${containerHome}/${dependency}/${directory}`);
                }
            }
        }
        params.addVolume(`${partFilePath}`, `${nodeModules}/${dependency}/part`);
        const businessPath = `${dependencyBase}/business`;
        if (fs.existsSync(businessPath)) {
            params.addVolume(businessPath, `${nodeModules}/${dependency}/business`);
        }
        const dataPath = `${dependencyBase}/data`;
        if (fs.existsSync(dataPath)) {
            params.addVolume(dataPath, `${nodeModules}/${dependency}/data`);
        }
        const rolePath = getPartApiRolePath({
            dependency,
            dependencyBase,
            isControl,
            processPath
        });
        if (rolePath) {
            params.addVolume(rolePath, `${nodeModules}/${dependency}/api/role`);
        }
        if (runnablePart && fs.existsSync(`/${org}/${process}/api/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`);
        }
        if (fs.existsSync(`${dependencyBase}/api/common`)) {
            params.addVolume(`${dependencyBase}/api/common`, `${nodeModules}/${dependency}/api/common`);
        }
    }
};
