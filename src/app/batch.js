const attachments$ = require('./attachments');
const {Observable} = require('rxjs');
const {mergeMap, take, tap, finalize} = require('rxjs/operators');
const es = require('event-stream');
const {fnbStatement, fnbTransaction} = require('./translators');
const parse = require('csv-parse');
const hash = require('object-hash');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const url = 'mongodb://localhost:27017';
const dbName = 'ekugcineni';

const client = new MongoClient(url, {useNewUrlParser: true});

const createStatement$ = (translator, attachment) =>
    Observable.create(observer => {
        const csvParser = parse({
            relax_column_count: true,
            ltrim: true,
            rtrim: true
        });
        const innerStream =
            es.readArray([attachment])
                .pipe(es.split(/(\r?\n)/))
                .pipe(csvParser)
                .pipe(translator)
                .pipe(es.map((statement, callback) => {
                    statement.id = hash(attachment);
                    statement.raw = attachment;
                    observer.next(statement);
                    callback();
                }));
        innerStream.on('end', () => observer.complete());
    });

const createTransactions$ = (translator, statement, batchId = Date.now()) =>
    Observable.create(observer => {
        const csvParser = parse({
            relax_column_count: true,
            ltrim: true,
            rtrim: true
        });
        const innerStream =
            es.readArray([statement.raw])
                .pipe(es.split(/(\r?\n)/))
                .pipe(csvParser)
                .pipe(translator)
                .pipe(es.map((transaction, callback) => {
                    transaction.id = hash(transaction);
                    transaction.batchId = batchId;
                    transaction.statement = statement._id;
                    observer.next(transaction);
                    callback();
                }));
        innerStream.on('end', () => observer.complete());
    });

const saveStatement$ = (db, statement) =>
    Observable.create(observer => {
        const statements = db.collection('statements');
        statements.findOne({id: statement.id}, (err, doc) => {
            if (doc) {
                // Statement already saved. Moving along ...
                observer.next(statement);
                observer.complete();
            } else {
                // Save statement
                statements.insertOne(statement, (err, result) => {
                    if (err) {
                        console.error(`Failed to save statement number ${statement.statementNumber}`);
                        console.error(err.stack);
                        observer.error(err);
                        return;
                    }
                    assert.equal(1, result.insertedCount);
                    console.log(`Saved statement number ${statement.statementNumber} with _id ${statement._id} successfully`);
                    observer.next(statement);
                    observer.complete();
                });
            }
        });
    });

const saveTransaction$ = (db, transaction) =>
    Observable.create(observer => {

        const transactions = db.collection('transactions');
        transactions.findOne({$and: [{id: transaction.id}, {batchId: {$ne: transaction.batchId}}]}, (err, doc) => {
            if (doc) {
                // Transaction already saved. Moving along ...
                observer.next(transaction);
                observer.complete();
            } else {
                // Save Transaction
                transactions.insert(transaction, (err, result) => {
                    if (err) {
                        console.error(`Failed to save transaction ${transaction.id}`);
                        console.error(err.stack);
                        observer.error(err);
                        return;
                    }
                    assert.equal(1, result.insertedCount);
                    console.log(`Saved transaction ${transaction._id} successfully`);
                    observer.next(transaction);
                    observer.complete();
                });
            }
        });
    });


client.connect((err) => {
    assert.equal(null, err);

    process.on('SIGINT', () => {
        console.log('disconnecting mongodb ...');
        client && client.close();
        process.exit();
    });

    console.log("Connected successfully to server");
    const db = client.db(dbName);

    attachments$('FNB Cheque Statements')
        .pipe(
            mergeMap(attachment => createStatement$(fnbStatement(), attachment)),
            mergeMap(statement => saveStatement$(db, statement)),
            mergeMap(savedStatement => createTransactions$(fnbTransaction(), savedStatement)),
            mergeMap(savedTransaction => saveTransaction$(db, savedTransaction)),
            finalize(() => client.close())
        )
        .subscribe(savedTransaction => savedTransaction,
            (err) => console.error(err), () => console.log(`completed!`));

});