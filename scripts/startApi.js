import {
    divide,
    info,
} from './logger.js';
import createApiContainer from './createApiContainer.js';
import createCiCd from './createCiCd.js';
import createDirectories from './createDirectories.js';
import createMissingApiFiles from './createMissingApiFiles.js';
import getApiUtilityDirectories from './getApiUtilityDirectories.js';
import isEtl from './isEtl.js';
import linkApiEditorFiles from './linkApiEditorFiles.js';
import mapApiCore from './mapApiCore.js';
import mapApiDependencies from './mapApiDependencies.js';
import mapApiProcesses from './mapApiProcesses.js';
import mapApiRunnable from './mapApiRunnable.js';
import mapApiUtilities from './mapApiUtilities.js';
import mapLocalizations from './mapLocalizations.js';
import mapNode from './mapNode.js';
import mapRunnableSearchableProperties from './mapRunnableSearchableProperties.js';
import mapSettings from './mapSettings.js';
import mapSystemTenants from './mapSystemTenants.js';
import registerApiDatabaseTasks from './registerApiDatabaseTasks.js';
import removeRootOwnedDirectories from './removeRootOwnedDirectories.js';
import { measure } from './timing.js';
export default params => {
    const { localBuild } = params;
    if (isEtl(params)) {
        info('Setting up ETL');
        params.isEtl = true;
    } else {
        info('Setting up API');
    }
    divide();
    params.processType = 'api';
    measure('API: create missing files', () => createMissingApiFiles(params));
    measure('API: create directories', () => createDirectories({
        ...params,
        extraDirectories: [...getApiUtilityDirectories(params), `/tmp/${params.repo}/migration`, `/tmp/${params.repo}/storage`]
    }));
    measure('API: remove root-owned directories', () => removeRootOwnedDirectories(params));
    measure('API: link VS Code files', () => linkApiEditorFiles(params));
    measure('API: map Node files', () => mapNode(params));
    measure('API: map settings', () => mapSettings(params));
    measure('API: map API processes', () => mapApiProcesses(params));
    measure('API: map system tenants', () => mapSystemTenants(params));
    measure('API: map searchable properties', () => mapRunnableSearchableProperties(params));
    measure('API: map dependencies', () => mapApiDependencies(params));
    measure('API: map localizations', () => mapLocalizations(params));
    measure('API: map runnable files', () => mapApiRunnable(params));
    measure('API: map utilities', () => mapApiUtilities(params));
    measure('API: map core', () => mapApiCore(params));
    measure('API: join volumes', () => params.joinVolumes());
    if (!isEtl(params)) {
        measure('API: create CI/CD', () => createCiCd(params));
    }
    if (!localBuild) {
        measure('API: register database container tasks', () => registerApiDatabaseTasks(params));
    }
    measure('API: create Compose file', () => createApiContainer(params));
};
