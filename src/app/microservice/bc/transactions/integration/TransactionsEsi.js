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

async function updateTransactionsWithNewCategory(category) {
    try {
        const {transactionsDb} = await db;
        return transactionsDb.updateMany(
            {description: {$in: category.regex}}, {$addToSet: {categories: category._id}}
        );
    } catch (e) {
        throw e;
    }
}

async function removeCategoriesFromTransactions(categoryId) {
    try {
        const {transactionsDb} = await db;
        return transactionsDb.updateMany({categories: categoryId}, {$pull: {categories: categoryId}});
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

module.exports = {
    getTransactions,
    updateTransactionsWithNewCategory,
    removeCategoriesFromTransactions,
    createTransactions,
};