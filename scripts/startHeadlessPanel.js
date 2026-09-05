import createCiCd from './createCiCd.js'
import createDirectories from './createDirectories.js'
import {
    divide,
    info,
} from './logger.js'
import mapLocalizations from './mapLocalizations.js'
import mapNode from './mapNode.js'
import {
    mapDependencies,
    mapRunnable,
    mapSecrets,
} from './startPanel.js'
import mapSettings from './mapSettings.js'
import {
    createDirIfNotExists,
    createFileIfNotExists,
    isDir,
    isFile,
    replaceVariables,
    writeFile,
} from './os.js'
import { measure } from './timing.js'

export const headlessPanelStructure = {
    'appActions.jsx': 'export default <></>\n',
    form: {
        'form.jsx': '',
    },
    headless: '',
    list: {
        'list.jsx': '',
    },
    'menu.jsx': 'export default []\n',
    panel: {
        'darkLight.jsx': '',
        'error.jsx': '',
        'initial.css': '',
        'layout.jsx': '',
        'loader.html': '',
        'menu.jsx': 'export default []\n',
        'notFound.jsx': '',
        'routes.jsx': 'export default []\n',
        'unauthorized.jsx': '',
    },
    'routes.jsx': 'export default []\n',
    'settingsOverride.json': '{\n    "accounts": {\n        "client": "panel"\n    }\n}\n',
    svg: {
        'dark.jsx': '',
        'light.jsx': '',
    },
}

export const ensureHeadlessPanelStructure = (basePath, structure) => {
    for (const [name, node] of Object.entries(structure)) {
        const nodePath = `${basePath}/${name}`
        if (node && typeof node === 'object') {
            createDirIfNotExists(nodePath)
            ensureHeadlessPanelStructure(nodePath, node)
            continue
        }
        if (!isFile(nodePath)) {
            createFileIfNotExists(nodePath)
            if (node) {
                writeFile(nodePath, node)
            }
        }
    }
}

const mapPanel = params => {
    const {
        containerHome,
        process,
        processPath,
        repo,
    } = params
    const targetBase = `${containerHome}/${repo}/${process}/src`
    const mappings = {
        form: 'components/form',
        list: 'components/list',
        panel: 'panel',
        svg: 'svg',
    }
    for (const [source, target] of Object.entries(mappings)) {
        const sourcePath = `${processPath}/${source}`
        if (isDir(sourcePath)) {
            params.addVolume(sourcePath, `${targetBase}/${target}`)
        }
    }
}

export default params => {
    info('Setting up headless Panel')
    divide()

    params.processType = 'panel'
    measure('headless panel: ensure structure', () => ensureHeadlessPanelStructure(
        params.processPath,
        headlessPanelStructure,
    ))
    measure('headless panel: create directories', () => createDirectories(params))
    measure('headless panel: create CI/CD', () => createCiCd(params))
    measure('headless panel: map panel', () => mapPanel(params))
    measure('headless panel: map dependencies', () => mapDependencies(params))
    measure('headless panel: map settings', () => mapSettings(params))
    measure('headless panel: map localizations', () => mapLocalizations(params))
    measure('headless panel: map runnable files', () => mapRunnable(params))
    measure('headless panel: map secrets', () => mapSecrets(params))
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
