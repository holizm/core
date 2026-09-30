export const createRealmKeycloak = async (origin, credentials) => {
    const baseUrl = origin.replace(/\/$/, '')
    const form = credentials.clientSecret
        ?
        {
            client_id: 'adminApi',
            client_secret: credentials.clientSecret,
            grant_type: 'client_credentials',
        }
        :
        {
            client_id: 'admin-cli',
            grant_type: 'password',
            password: credentials.password,
            username: credentials.username,
        }
    const tokenResponse = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
        body: new URLSearchParams(form),
        method: 'POST',
    })
    if (!tokenResponse.ok) throw new Error(`Keycloak master authentication failed: ${tokenResponse.status}`)
    const token = (await tokenResponse.json()).access_token
    if (!token) throw new Error('Keycloak master authentication returned no access token')
    const request = async (method, resource, body, allowNotFound) => {
        const response = await fetch(`${baseUrl}/admin/${resource}`, {
            body: body === undefined ? undefined : JSON.stringify(body),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            method,
        })
        if (allowNotFound && response.status === 404) return null
        if (!response.ok) throw new Error(`Keycloak ${method} ${resource} failed: ${response.status}`)
        if (response.status === 204 || response.status === 201) return null
        const content = await response.text()
        return content ? JSON.parse(content) : null
    }
    return request
}
