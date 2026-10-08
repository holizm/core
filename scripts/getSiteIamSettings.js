import fs from 'fs'
import path from 'path'

export default ({
    home,
    repo,
}) => {
    const repositories = [...new Set([repo.replace(/Themes$/, ''), repo])]
    const credentials = new Map()
    for (const repository of repositories) {
        const secretPath = path.join(home, 'secrets', `${repository}.json`)
        if (!fs.existsSync(secretPath)) continue
        const settings = JSON.parse(fs.readFileSync(secretPath, 'utf8'))
        for (const entry of settings.production?.site?.iamClientSecrets || []) {
            if (entry.domain && entry.secret) credentials.set(`${entry.domain}/${entry.realm || ''}`, entry)
        }
    }
    const settings = { iamClientSecrets: [...credentials.values()] }
    return settings
}
