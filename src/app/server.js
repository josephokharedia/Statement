const express = require('express');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;


const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, {useNewUrlParser: true});
const dbName = 'ekugcineni';
const app = express();
const port = process.env.PORT || 3000;
const defaultFromDate = new Date('01-01-2000');
const defaultPageSize = 10;


function run(db) {
    app.get('/api/transactions', (req, res) => {

        const search = req.query['search'] || '';
        const pageSize = isNaN(req.query['pageSize']) ? defaultPageSize : parseInt(req.query['pageSize']);
        const pageIndex = isNaN(req.query['pageIndex']) ? 0 : parseInt(req.query['pageIndex']);
        const fromDate = req.query['fromDate'] && /[0-9-\/]+/.test(req.query['fromDate']) && new Date(req.query['fromDate']) || defaultFromDate;
        const toDate = req.query['toDate'] && /[0-9-\/]+/.test(req.query['toDate']) && new Date(req.query['toDate']) || new Date(Date.now());
        const sortField = req.query['sortField'] || 'date';
        const sortDirection = req.query['sortDirection'] === 'asc' ? -1 : +1;

        const sort = {};
        sort[sortField]=sortDirection;

        console.log(`search:${search}, pageSize:${pageSize}, pageIndex:${pageIndex}, 
        fromDate:${fromDate}, toDate:${toDate}, sortField:${sortField}, sortDirection:${sortDirection}`);

        const transactions = db.collection('transactions');
        transactions.find({description: {$regex: `${search}`, $options: 'i'}}, {
            description: 1, amount: 1, balance: 1
        }).limit(pageSize).skip(pageIndex * pageSize).sort(sort).toArray((err, docs) => {
            if (err) {
                handleError(err);
                result.json({});
                return;
            }
            res.json(docs);
        });
    });
}


client.connect((err) => {
    assert.equal(null, err);
    process.on('SIGINT', () => {
        console.log('disconnecting mongodb ...');
        client && client.close();
        process.exit();
    });

    const server = app.listen(port, () => console.log(`Ekugcineni backend listening on port ${port}!`));
    const db = client.db(dbName);
    run(db);
});

const handleError = (err) => {
    console.log('error occurred!');
    console.log(err.stack);
};
