/* Transaction Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const {handleError} = require('../../../shared/Utils.js');
const event = require('../../../shared/EventUtil');
const router = express.Router();

const txBa = require('../control/TransactionsBa');
router.get('/', getTransactions);
router.get('/searchDescription', searchTransactionDescription);
router.get('/aggregateCategoriesForYear/:year', aggregateCategoriesForYear);
router.get('/aggregateCategoriesForStatement/:statementId', aggregateCategoriesForStatement);

async function getTransactions(req, res) {
    const query = req.query;
    try {
        const result = await txBa.getTransactions(query);
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Transactions with queryOptions ${query}`);
    }
}

async function searchTransactionDescription(req, res) {
    const result = await txBa.searchTransactionDescription(req.query);
    res.send(result);
}

async function aggregateCategoriesForYear(req, res) {
    const query = req.params;
    try {
        const result = await txBa.aggregateCategoriesForYear(query);
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Transactions aggregate for year with queryOptions ${query}`);
    }
}

async function aggregateCategoriesForStatement(req, res) {
    const query = req.params;
    try {
        const result = await txBa.aggregateCategoriesForStatement(query);
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Transactions aggregate for statement with queryOptions ${query}`);
    }
}

event.on('CreatedCategory', async (category) => {
    try {
        await txBa.updateTransactionsWithNewCategory(category);
    } catch (e) {
        console.error(e);
        throw e;
    }
});

event.on('UpdatedCategory', async (category) => {
    try {
        await txBa.updateTransactionsWithUpdatedCategory(category);
    } catch (e) {
        console.error(e);
        throw e;
    }
});

event.on('DeletedCategory', async (categoryId) => {
    try {
        await txBa.updateTransactionsWithDeletedCategory(categoryId);
    } catch (e) {
        console.error(e);
        throw e;
    }
});

event.on('CreatedStatement', async (statement) => {
    try {
        await txBa.createTransactionsFromStatement(statement);
    } catch (e) {
        console.error(e);
        throw e;
    }
});

module.exports = {router};