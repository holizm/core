import getThemeKey from './getThemeKey.js'
import { writeFile } from './os.js'

export default ({
    addVolume,
    containerHome,
    home,
    multiThemed,
    process,
    repo,
    siteCore,
    themeDirectories = [],
}) => {
    if (siteCore !== 'newSite') {
        addVolume(
            `${home}/site/buildRichTextRegistry.js`,
            `${containerHome}/${repo}/${process}/buildRichTextRegistry.js`,
        )
    }
    const configuration = {
        multiThemed,
        themeNumbers: themeDirectories.map(getThemeKey),
    }
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
