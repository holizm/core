import isControlRunnable from './isControlRunnable.js';
import {
    copyFileIfNotExists,
    createDirIfNotExists,
    createFileIfNotExists,
    writeFileIfNotExists,
} from './os.js';
export default params => {
    const {
        commonPath,
        dependenciesPath,
        home,
        initialPath,
        privateSettingsPath,
        publicSettingsPath
    } = params;
    writeFileIfNotExists('process.js', `import { start } from 'core'\n\nstart()`);
    createDirIfNotExists(commonPath);
    createFileIfNotExists(dependenciesPath);
    copyFileIfNotExists(`${home}/core/api/initialTemplate`, initialPath);
    copyFileIfNotExists(`${home}/core/api/privateSettingsTemplate`, privateSettingsPath);
    if (!isControlRunnable(params)) {
        copyFileIfNotExists(`${home}/core/api/publicSettingsTemplate`, publicSettingsPath);
    }
};
