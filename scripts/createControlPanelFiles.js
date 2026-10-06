import path from 'path'
import { writeFile } from './os.js'

const files = {
    'src/appActions.jsx': `import {
    ClearCache,
    GlobalizationChooseLocale,
} from 'appActions'

export default <>
    <GlobalizationChooseLocale />
    <ClearCache />
</>
`,
    'src/menu.jsx': `import controlPanelMenu from 'controlPanelMenu'

export default controlPanelMenu
`,
    'src/runnable/routes.jsx': `import { Navigate } from 'react-router'

export default [
    {
        component: <Navigate
            replace
            to='/tenants/tenant/list'
        />,
        path: '/',
    },
]
`,
}

export default basePath => {
    for (const [file, content] of Object.entries(files)) {
        writeFile(path.join(basePath, file), content)
    }
}
