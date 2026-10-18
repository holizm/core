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
    ]
    for (const [source, template, target] of files) {
        const sourcePath = path.join(params.processPath, source)
        if (!isFile(sourcePath) || !getContent(sourcePath).trim()) {
            writeFile(sourcePath, getContent(path.join(params.home, 'core/panel/headless', template)))
        }
        params.addVolume(sourcePath, `${targetBase}/${target}`)
    }
    for (const file of ['initial.css', 'loader.html']) {
        params.addVolume(`${params.processPath}/panel/${file}`, `${targetBase}/${file}`)
    }
}
