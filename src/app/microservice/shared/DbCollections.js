const MongoClient = require("mongodb").MongoClient;

//mongodb.ekugcineni.svc
const DB_HOST = process.env.MONGODB_HOSTNAME || 'localhost';
const DB_PORT = process.env.MONGODB_PORT || '27017';
const DB_USER = process.env.MONGODB_USER || '';
const DB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const DB_NAME = process.env.MONGODB_DATABASE || 'ekugcineni';

const URL = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
console.log(`Connecting to ${URL} ...`);
const client = new MongoClient(URL, {useNewUrlParser: true});


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