import fs from 'fs'
import path from 'path'

export default (secretPath, domain, credentials) => {
    const currentContent = fs.readFileSync(secretPath, 'utf8')
    const settings = JSON.parse(currentContent)
    settings.production ??= {}
    for (const [clientId, secret] of Object.entries(credentials)) {
        settings.production[clientId] ??= {}
        const current = settings.production[clientId].iamClientSecrets || []
        const remaining = current.filter(item => item.domain !== domain)
        settings.production[clientId].iamClientSecrets = [
            ...remaining,
            {
                domain,
                secret,
            },
        ]
    }
    const content = `${JSON.stringify(settings, null, 4)}\n`
    if (content === currentContent) return
    const temporaryPath = path.join(path.dirname(secretPath), `.${path.basename(secretPath)}.${process.pid}`)
    fs.writeFileSync(temporaryPath, content, { mode: 0o600 })
    fs.renameSync(temporaryPath, secretPath)
}
