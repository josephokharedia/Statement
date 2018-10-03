const {Observable, interval, of} = require('rxjs');
const {take, mergeMap, tap, scan, sample, share, filter, timer, switchMap, merge} = require('rxjs/operators');
const statements = require('./statements');
const {fnb, nedbank} = require('./transactions');
const util = require('util');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

const fnbTransactions = statements(null, 'FNB Cheque Statements').pipe(mergeMap(csv => fnb(csv)));
const nedbankTransactions = statements(null, 'Nedbank Statements').pipe(take(1), mergeMap(csv => nedbank(csv)));

const url = 'mongodb://localhost:27017';
const dbName = 'statements';
const client = new MongoClient(url);
client.connect((err, db) => {
    const dbo = db.db(dbName);
    dbo.collection('transactions').drop();

    fnbTransactions.subscribe(tx => {
        dbo.collection('transactions').insertOne(tx, (err, r) => {
            try {
                assert.equal(null, err);
                assert.equal(1, r.insertedCount);
            } catch (err) {
                console.log(tx);
                console.log(err.stack);
            }
        });
    });

    process.on('SIGINT', () => {
        db.close();
        process.exit();
    })
});