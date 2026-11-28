import {
    join,
    relative,
} from 'path'
import isDir from './isDir.js'
import isFile from './isFile.js'
import {
    getDirs,
    getLines,
} from './os.js'

export default (repoPath, corePath, coreThemesPath) => {
    const directories = getDirs(repoPath).filter(name => /^theme\d+$/.test(name))
    if (corePath && coreThemesPath && isFile(coreThemesPath)) {
        const themes = new Set(getLines(coreThemesPath).map(line => line.trim()).filter(Boolean))
        for (const theme of themes) {
            if (!/^theme\d+$/.test(theme) || !isDir(join(corePath, theme))) {
                throw new Error(`Unknown core theme '${theme}' in ${coreThemesPath}`)
            }
            directories.push(relative(repoPath, join(corePath, theme)))
        }
    }
    return directories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
