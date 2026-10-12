import assert from 'assert/strict'
import test from 'node:test'
import createCompassConnection from './createCompassConnection.js'

test('createCompassConnection uses the Mongo port and encodes credentials', () => {
    const compose = {
        services: {
            database: {
                environment: {
                    MONGO_INITDB_ROOT_PASSWORD: 'pass@word',
                    MONGO_INITDB_ROOT_USERNAME: 'user:name',
                },
                ports: [{ published: 27018, target: 27017 }],
            },
        },
    }
    const connection = createCompassConnection('db.example', compose)
    assert.equal(connection.favorite.name, 'db.example')
    assert.equal(connection.connectionOptions.connectionString, 'mongodb://user%3Aname:pass%40word@db.example:27018/?directConnection=true&authSource=admin')
    assert.match(connection.id, /^[0-9a-f-]{36}$/)
})

test('createCompassConnection rejects missing database credentials', () => {
    assert.throws(() => createCompassConnection('db.example', { services: {} }), /Missing database port or credentials/)
})
