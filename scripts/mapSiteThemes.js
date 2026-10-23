import { realpathSync } from 'fs'
import { join } from 'path'
import getThemeKey from './getThemeKey.js'

export default params => {
    if (!params.multiThemed) return
    for (const directory of params.themeDirectories) {
        const source = realpathSync(join(params.processPath, '..', directory))
        const key = getThemeKey(directory)
        params.addVolume(
            source,
            `${params.containerHome}/${params.repo}/${params.process}/src/themes/${key}`,
        )
    }
}
