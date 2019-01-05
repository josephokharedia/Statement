/*
 * Send query instruction to mongodb and return return results from db
 */
const db = require('../../../shared/DbCollections');

async function getTransactions(pipeline) {
    try {
        const {transactionsDb} = await db;
        return transactionsDb.aggregate(pipeline).toArray();
    } catch (e) {
        throw e;
    }
}

async function categorizeTransactions(categoryId, categoryRegex, transactionIds = []) {
    try {
        const {transactionsDb} = await db;
        const query = [{description: {$in: categoryRegex}}]; // find transactions that match the category regex

        if (transactionIds.length) {
            query.push({_id: {$in: transactionIds}}); // use these transactions instead of all transactions
        }

        return transactionsDb.updateMany(
            {$and: query},
            {$addToSet: {categories: categoryId}}
        );
    } catch (e) {
        throw e;
    }
}

async function deCategorizeTransactions(categoryId, transactionIds = []) {
    try {
        const {transactionsDb} = await db;
        const query = [{categories: categoryId}]; // find transactions that belong to category

        if (transactionIds.length) {
            query.push({_id: {$in: transactionIds}}); // use these transactions instead of all transactions
        }

        return transactionsDb.updateMany(
            {$and: query},
            {$pull: {categories: categoryId}});
    } catch (e) {
        throw e;
    }
}

async function createTransactions(transactions) {
    try {
        const {transactionsDb} = await db;
        return transactionsDb.insertMany(transactions);
    } catch (e) {
        throw e;
    }
}

async function saveDraft(draft) {
    try {
        const {draftsDb} = await db;
        const {ops} = await draftsDb.insertOne(draft);
        return ops[0];
    } catch (e) {
        throw e;
    }
}

module.exports = {
    getTransactions,
    categorizeTransactions,
    deCategorizeTransactions,
    createTransactions,
    saveDraft
};