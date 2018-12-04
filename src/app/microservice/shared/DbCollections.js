const MongoClient = require("mongodb").MongoClient;

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, {useNewUrlParser: true});
const DATABASE_NAME = process.env.PROFILE === 'TEST' ? 'ekugcineni-xunit' : 'ekugcineni';


module.exports = async function Db() {
    try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const transactionsDb = db.collection('transactions');
        const statementsDb = db.collection('statements');
        const categoriesDb = db.collection('categories');
        return {transactionsDb, statementsDb, categoriesDb}
    } catch (e) {
        console.log(e.stack);
    }
}();

process.on('SIGINT', () => {
    console.log('disconnecting mongodb ...');
    client && client.close();
    process.exit();
});