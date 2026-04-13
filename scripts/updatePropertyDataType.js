var dbName = 'database';
var collectionName = 'collection';
var fieldName = 'property';
var sourceType = 'string';
var targetType = 'int';

var collection = db[collectionName];
var totalDocs = collection.countDocuments({ [fieldName]: { $exists: true } });

print('Updating ' + totalDocs + ' documents in ' + dbName + '.' + collectionName);
print('Field: ' + fieldName + ' (' + sourceType + ' -> ' + targetType + ')');

var result = collection.updateMany(
    { [fieldName]: { $exists: true } },
    [
        {
            $set: {
                [fieldName]: {
                    $convert: {
                        input: '$' + fieldName,
                        to: 'int',
                        onError: '$' + fieldName,
                        onNull: null
                    }
                }
            }
        }
    ]
);

print('Modified: ' + result.modifiedCount);
print('Matched: ' + result.matchedCount);
