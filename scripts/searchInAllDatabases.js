const searchPattern = 'yourTextHere'
const searchFlags = 'i'
const searchRegex = new RegExp(searchPattern, searchFlags)
const matchesLimit = 5

const filter = {
    contents: [
        'repetitionsCounts',
        'parts',
        'values',
    ],
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
        let matchesCount = 0
        const cursor = database[collectionName].find()

        while (cursor.hasNext() && matchesCount < matchesLimit) {
            const document = cursor.next()
            searchRegex.lastIndex = 0
            if (!searchRegex.test(JSON.stringify(document))) continue

            if (matchesCount === 0) {
                print(`\nDatabase: ${databaseName}, Collection: ${collectionName}`)
            }

            printjson(document)
            matchesCount++
        }
    })
})
