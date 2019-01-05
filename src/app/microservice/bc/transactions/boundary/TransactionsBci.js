/* Transaction Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const event = require('../../../shared/EventUtil');
const router = express.Router();

const txBa = require('../control/TransactionsBa');
router.get('/', getTransactions);
router.get('/searchDescription', searchTransactionDescription);
router.get('/aggregateCategoriesForYear/:year', aggregateCategoriesForYear);
router.get('/aggregateCategoriesForStatement/:statementId', aggregateCategoriesForStatement);

async function getTransactions(req, res) {
    const query = req.query;
    const result = await txBa.getTransactions(query);
    res.status(result.error? 500 : 200).send(result);
}

async function searchTransactionDescription(req, res) {
    const result = await txBa.searchTransactionDescription(req.query);
    res.status(result.error? 500 : 200).send(result);
}

async function aggregateCategoriesForYear(req, res) {
    const query = req.params;
    const result = await txBa.aggregateCategoriesForYear(query);
    res.status(result.error? 500 : 200).send(result);
}

async function aggregateCategoriesForStatement(req, res) {
    const query = req.params;
    const result = await txBa.aggregateCategoriesForStatement(query);
    res.status(result.error? 500 : 200).send(result);
}

event.on('CreatedCategory', async (category) => {
    await txBa.categorizeTransactions(category);
});

event.on('UpdatedCategory', async (category) => {
    await txBa.categorizeTransactions(category);
});

event.on('DeletedCategory', async (categoryId) => {
    await txBa.deCategorizeTransactions(categoryId);
});

event.on('CreatedTransactions', async (transactions) => {
    await txBa.categorizeTransactions(null, transactions);
});

module.exports = {router};