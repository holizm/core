import createCiCd from './createCiCd.js'
import createDirectories from './createDirectories.js'
import ensureHeadlessPanelStructure from './ensureHeadlessPanelStructure.js'
import headlessPanelStructure from './headlessPanelStructure.js'
import isControlPanel from './isControlPanel.js'
import isDir from './isDir.js'
import isFile from './isFile.js'
import {
    divide,
    info,
} from './logger.js'
import mapHeadlessPanel from './mapHeadlessPanel.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'
import {
    mapDependencies,
    mapPanelDeclarations,
    mapRunnable,
} from './startPanel.js'
import mapSettings from './mapSettings.js'
import prepareHeadlessPanelUi from './prepareHeadlessPanelUi.js'
import { replaceVariables } from './os.js'
import { measure } from './timing.js'

export const headlessPanelDeclarations = {
    'appActions.jsx': 'export default <></>\n',
    'menu.jsx': 'export default []\n',
    'routes.jsx': 'export default []\n',
}

export {
    ensureHeadlessPanelStructure,
    headlessPanelStructure,
}

export default params => {
    info('Setting up headless Panel')
    divide()

    params.processType = 'panel'
    measure('headless panel: ensure structure', () => ensureHeadlessPanelStructure(
        params.processPath,
        headlessPanelStructure,
    ))
    if (!isControlPanel(params)) {
        measure('headless panel: ensure declarations', () => ensureHeadlessPanelStructure(
            params.processPath,
            headlessPanelDeclarations,
        ))
    }
    measure('headless panel: create directories', () => createDirectories(params))
    measure('headless panel: create CI/CD', () => createCiCd(params))
    measure('headless panel: map panel', () => mapHeadlessPanel(params))
    measure('headless panel: prepare UI contract', () => prepareHeadlessPanelUi(params))
    measure('headless panel: map declarations', () => mapPanelDeclarations(params))
    measure('headless panel: map dependencies', () => mapDependencies(params))
    measure('headless panel: map settings', () => mapSettings(params))
    measure('headless panel: map localizations', () => mapLocalizations(params))
    measure('headless panel: map runnable files', () => mapRunnable(params))
    measure('headless panel: map Node files', () => mapNode(params))

    const {
        composeFile,
        containerHome,
        home,
        menusDirectoryPath,
        process,
        repo,
        tenantsPath,
    } = params
    if (isFile(tenantsPath)) {
        params.addVolume(tenantsPath, `${containerHome}/${repo}/${process}/public/tenants`)
    }
    if (isDir(menusDirectoryPath)) {
        params.addVolume(menusDirectoryPath, `${containerHome}/${repo}/${process}/src/menus`)
    }

    measure('headless panel: join volumes', () => params.joinVolumes())
    const composeTemplatePath = `${home}/core/container/composes/panel`
    measure('headless panel: create Compose file', () => replaceVariables(composeTemplatePath, composeFile, params))
}
