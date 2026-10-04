import { randomUUID } from 'crypto'

export default (host, compose) => {
    const database = compose.services?.database
    const port = database?.ports?.find(port => Number(port.target) === 27017)?.published
    const user = database?.environment?.MONGO_INITDB_ROOT_USERNAME
    const password = database?.environment?.MONGO_INITDB_ROOT_PASSWORD
    if (!port || !user || !password) {
        throw new Error(`Missing database port or credentials for ${host}`)
    }
    const connection = {
        connectionOptions: {
            connectionString: `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/?directConnection=true&authSource=admin`,
        },
        favorite: { name: host },
        id: randomUUID(),
        savedConnectionType: 'favorite',
    }
    return connection
}
