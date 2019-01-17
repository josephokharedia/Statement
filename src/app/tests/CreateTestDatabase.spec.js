const assert = require('assert');
const MongoClient = require("mongodb").MongoClient;
const statementsData = require('./testdata/statements.testdata.spec');
const transactionsData = require('./testdata/transactions.testdata.spec');
const categoriesData = require('./testdata/categories.tesdata.spec');
const draftsData = require('./testdata/drafts.testdata.spec');
const {addHashCodeToTransactions, addHashCodeToStatements} = require('./TestUtils');


//mongodb.ekugcineni.svc
const DB_HOST = process.env.MONGODB_HOSTNAME || 'localhost';
const DB_PORT = process.env.MONGODB_PORT || '27017';
const DB_USER = process.env.MONGODB_USER || '';
const DB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const DB_NAME = process.env.MONGODB_DATABASE || 'ekugcineni-xunit';
const TRANSACTION_COLLECTION = 'transactions';
const STATEMENT_COLLECTION = 'statements';
const CATEGORIES_COLLECTION = 'categories';
const DRAFTS_COLLECTION = 'drafts';

const URL = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
const client = new MongoClient(URL, {useNewUrlParser: true});


module.exports = async function createTestDb() {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const transactionsDb = db.collection(TRANSACTION_COLLECTION);
        const statementsDb = db.collection(STATEMENT_COLLECTION);
        const categoriesDb = db.collection(CATEGORIES_COLLECTION);
        const draftsDb = db.collection(DRAFTS_COLLECTION);

        // Remove all from collections
        await statementsDb.deleteMany({});
        await transactionsDb.deleteMany({});
        await categoriesDb.deleteMany({});
        await draftsDb.deleteMany({});

        // Insert into statement collections
        addHashCodeToStatements(statementsData);
        let {result: {ok: val1}} = await statementsDb.insertMany(statementsData);
        assert.equal(val1, 1);

        // Insert into transaction collections
        addHashCodeToTransactions(transactionsData);
        let {result: {ok: val2}} = await transactionsDb.insertMany(transactionsData);
        assert.equal(val2, 1);

        // Insert into categories collections
        let {result: {ok: val3}} = await categoriesDb.insertMany(categoriesData);
        assert.equal(val3, 1);

        // Insert into drafts collections
        let {result: {ok: val4}} = await draftsDb.insertMany(draftsData);
        assert.equal(val4, 1);

    } catch (e) {
        console.log(e.stack);
    }
};
