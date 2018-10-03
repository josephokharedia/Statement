const MongoClient = require('mongodb').MongoClient;

MongoClient.connect("mongodb://127.0.0.1:27017", (err, db) => {
    if (err) throw err;
    console.log('connected successfully!');

    const dbo = db.db('statements');
    dbo.collection("transactions").aggregate([
        {
            $group: {
                _id: {hash: "$hash"},
                uniqueIds: {$addToSet: "$_id"},
                count: {$sum: 1}
            }
        },
        {
            $match: {
                count: {$gt: 1}
            }
        }
    ]);
    db.close();
});

