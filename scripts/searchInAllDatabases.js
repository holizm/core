let searchText = "yourTextHere";
let regex = new RegExp(searchText, "i");

let filter = {
    contents: [
        "repetitionsCounts",
        "parts",
        "values",
    ]
};

db.getMongo().getDBNames().forEach(dbName => {
    if (["admin", "config", "local"].includes(dbName)) return;
    if (filter && Object.keys(filter).length > 0 && !filter.hasOwnProperty(dbName)) return;

    let dbObj = db.getSiblingDB(dbName);
    let collections = dbObj.getCollectionNames();

    if (filter && filter[dbName] && filter[dbName].length > 0) {
        collections = collections.filter(c => filter[dbName].includes(c));
    }

    collections.forEach(collName => {
        let sampleDoc = dbObj[collName].findOne();
        if (!sampleDoc) return;

        let fields = Object.keys(sampleDoc);
        if (fields.length === 0) return;

        let query = { $or: fields.map(f => ({ [f]: regex })) };
        let cursor = dbObj[collName].find(query).limit(5);
        if (cursor.hasNext()) {
            print(`\nDatabase: ${dbName}, Collection: ${collName}`);
            cursor.forEach(doc => printjson(doc));
        }
    });
});
