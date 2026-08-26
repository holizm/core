import { getContent } from './os.js'

export default (templatePath, params) => getContent(templatePath)
    .replace(/\$\{(\w+)\}/g, (_, name) => params[name] || '')
