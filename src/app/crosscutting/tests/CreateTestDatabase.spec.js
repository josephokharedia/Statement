const assert = require('assert');
const MongoClient = require("mongodb").MongoClient;
const statementsData = require('./testdata/statements.testdata.spec');
const transactionsData = require('./testdata/transactions.testdata.spec');
const categoriesData = require('./testdata/categories.tesdata.spec');

const url = 'mongodb://localhost:27017';
const TEST_DATABASE = 'ekugcineni-xunit';
const TRANSACTION_COLLECTION = 'transactions';
const STATEMENT_COLLECTION = 'statements';
const CATEGORIES_COLLECTION = 'categories';

module.exports = async function createTestDb() {
    try {
        const client = await MongoClient.connect(url, {useNewUrlParser: true});
        const db = client.db(TEST_DATABASE);

        const transactionsDb = db.collection(TRANSACTION_COLLECTION);
        const statementsDb = db.collection(STATEMENT_COLLECTION);
        const categoriesDb = db.collection(CATEGORIES_COLLECTION);

        // Remove all from collections
        await statementsDb.deleteMany({});
        await transactionsDb.deleteMany({});
        await categoriesDb.deleteMany({});

        // Insert into statement collections
        let {result: {ok: val1}} = await statementsDb.insertMany(statementsData);
        assert.equal(val1, 1);

        // Insert into transaction collections
        let {result: {ok: val2}} = await transactionsDb.insertMany(transactionsData);
        assert.equal(val2, 1);

        // Insert into categories collections
        let {result: {ok: val3}} = await categoriesDb.insertMany(categoriesData);
        assert.equal(val3, 1);

    } catch (e) {
        console.log(e.stack);
    }
};
