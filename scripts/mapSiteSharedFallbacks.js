import {
    getContent,
    removeAndRecreateDir,
    writeFile,
} from './os.js'

const fallbacks = {
    breadcrumb: 'breadcrumbTemplate.jsx',
    pagination: 'paginationTemplate.jsx',
    richText: 'richTextTemplate.jsx',
}

export default params => {
    const {
        containerHome,
        process,
        repo,
    } = params
    const fallbackPath = `/tmp/${repo}/${process}/sharedFallbacks`
    const containerFallbackPath = `${containerHome}/${repo}/${process}/src/pageParts/sharedFallbacks`

    removeAndRecreateDir(fallbackPath)

    for (const [name, template] of Object.entries(fallbacks)) {
        const source = `${params.siteTemplatePath}/${template}`
        const target = `${fallbackPath}/${name}.jsx`

        writeFile(target, getContent(source))
    }

    params.addVolume(fallbackPath, containerFallbackPath)
}
