import { join } from 'path'
import getThemeKey from './getThemeKey.js'
import isFile from './isFile.js'
import {
    getContent,
    writeFile,
} from './os.js'

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
    const themeTitles = {}
    for (const directory of multiThemed ? themeDirectories : []) {
        const brandingPath = join(home, repo, directory, 'data', 'branding.json')
        const contentPath = join(home, repo, directory, 'data', 'home.json')
        const branding = isFile(brandingPath) ? JSON.parse(getContent(brandingPath)) : null
        const content = isFile(contentPath) ? JSON.parse(getContent(contentPath)) : null
        const documentTitle = branding?.documentTitle || content?.seo?.metaTitle || content?.seo?.title
        if (documentTitle) themeTitles[getThemeKey(directory)] = documentTitle
    }
    if (Object.keys(themeTitles).length) configuration.themeTitles = themeTitles
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
