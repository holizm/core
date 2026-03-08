let searchText = "yourTextHere";
let replacementText = "yourNewText";
let regex = new RegExp(searchText, "gi");

let filter = {
    contents: [
        "parts",
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

        dbObj[collName].find(query).forEach(doc => {
            let updates = {};
            for (let field of fields) {
                let value = doc[field];
                if (typeof value === "string" && regex.test(value)) {
                    regex.lastIndex = 0;
                    let newValue = value.replace(regex, replacementText);
                    updates[field] = newValue;
                }
            }
            if (Object.keys(updates).length > 0) {
                print(`Updating ${dbName}.${collName} id=${doc.id}`);
                dbObj[collName].updateOne(
                    { _id: doc._id },
                    { $set: updates }
                );
            }
        });
    });
});
