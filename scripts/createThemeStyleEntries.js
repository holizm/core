import { join } from 'path'
import getThemeKey from './getThemeKey.js'
import isFile from './isFile.js'
import {
    getContent,
    removeAndRecreateDir,
    writeFile,
} from './os.js'

export default params => {
    const {
        multiThemed,
        process,
        processPath,
        repo,
        themeDirectories,
    } = params
    if (!multiThemed) {
        writeFile(`/tmp/${repo}/${process}/style.css`, getContent(`${processPath}/style.css`))
        return
    }
    const directory = `/tmp/${repo}/${process}/themeStyles`
    removeAndRecreateDir(directory)
    themeDirectories.forEach(themeDirectory => {
        if (!isFile(join(processPath, '..', themeDirectory, 'style.css'))) return
        const themeNumber = getThemeKey(themeDirectory)
        const content = `@import '../../coreStyles/layerOrder.css';\n@import 'tailwindcss' source(none);\n@reference '../../core.css';\n@source '../{core,coreParts,coreContexts,coreFunctions,coreGetters,coreHooks,pageParts,partBarrels,parts,routes}';\n@source '../*.{js,jsx,ts,tsx}';\n@source '../themes/${themeNumber}';\n@import '../themes/${themeNumber}/style.css';\n`
        writeFile(`${directory}/theme${themeNumber}.css`, content)
    })
}
