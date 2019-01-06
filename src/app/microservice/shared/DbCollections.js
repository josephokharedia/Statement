const MongoClient = require("mongodb").MongoClient;

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, {useNewUrlParser: true});

const DB_USER = process.env.MONGODB_USER || '';
const DB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const DB_NAME = process.env.MONGODB_DATABASE || 'ekugcineni';


module.exports = async function Db() {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const transactionsDb = db.collection('transactions');
        const statementsDb = db.collection('statements');
        const categoriesDb = db.collection('categories');
        const draftsDb = db.collection('drafts');
        return {transactionsDb, statementsDb, categoriesDb, draftsDb}
    } catch (e) {
        console.log(e.stack);
    }
}();

process.on('SIGINT', () => {
    console.log('disconnecting mongodb ...');
    client && client.close();
    process.exit();
});