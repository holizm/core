import path from 'path'
import isFile from './isFile.js'
import {
    getContent,
    writeFile,
} from './os.js'

export default params => {
    const targetBase = `${params.containerHome}/${params.repo}/${params.process}/src`
    const files = [
        ['panelUi.jsx', 'panelUiTemplate', 'panelUi.jsx'],
        ['panel/error.jsx', 'errorTemplate', 'panel/error.jsx'],
        ['panel/errorBoundary.jsx', 'errorBoundaryTemplate', 'panel/errorBoundary.jsx'],
        ['panel/loader.jsx', 'loaderTemplate', 'panel/loader.jsx'],
        ['panel/unauthorized.jsx', 'unauthorizedTemplate', 'panel/unauthorized.jsx'],
        ['panel/head.html', 'headTemplate', 'head.html'],
        ['panel/initial.css', 'initialStyleTemplate', 'initial.css'],
        ['panel/loader.html', 'loaderMarkupTemplate', 'loader.html'],
    ]
    for (const [source, template, target] of files) {
        const sourcePath = path.join(params.processPath, source)
        if (!isFile(sourcePath) || !getContent(sourcePath).trim()) {
            writeFile(sourcePath, getContent(path.join(params.home, 'core/panel/headless', template)))
        }
        params.addVolume(sourcePath, `${targetBase}/${target}`)
    }
}
