const searchPattern = 'yourTextHere'
const searchFlags = 'gi'
const replacementText = 'yourNewText'
const searchRegex = new RegExp(searchPattern, searchFlags)

const filter = {
    contents: [
        'parts',
    ],
}

const addReplacements = (
    value,
    path,
    updates,
) => {
    if (typeof value === 'string') {
        searchRegex.lastIndex = 0
        const replacement = value.replace(searchRegex, replacementText)

        if (replacement !== value) {
            updates[path] = replacement
        }
        return
    }

    if (!value || typeof value !== 'object' || value._bsontype || value instanceof Date) return

    Object.entries(value).forEach(([
        property,
        propertyValue,
    ]) => {
        if (!path && property === '_id') return

        addReplacements(
            propertyValue,
            path
                ? `${path}.${property}`
                : property,
            updates,
        )
    })
}

db.getMongo().getDBNames().forEach(databaseName => {
    if (['admin', 'config', 'local'].includes(databaseName)) return
    if (
        filter
        && Object.keys(filter).length > 0
        && !Object.prototype.hasOwnProperty.call(filter, databaseName)
    ) return

    const database = db.getSiblingDB(databaseName)
    let collectionNames = database.getCollectionNames()

    if (filter?.[databaseName]?.length > 0) {
        collectionNames = collectionNames.filter(collectionName => filter[databaseName].includes(collectionName))
    }

    collectionNames.forEach(collectionName => {
        const cursor = database[collectionName].find()

        while (cursor.hasNext()) {
            const document = cursor.next()
            const updates = {}

            addReplacements(document, '', updates)

            if (Object.keys(updates).length === 0) continue

            print(`Updating ${databaseName}.${collectionName} id=${document.id || document._id}`)
            printjson(updates)
            database[collectionName].updateOne(
                { _id: document._id },
                { $set: updates },
            )
        }
    })
})
