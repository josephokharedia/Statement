/* Statements Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const {handleError} = require('../../../shared/Utils.js');
const router = express.Router();

const stmtBa = require('../control/StatementsBa');
router.get('/', getStatements);
router.get('/:statementId', getStatementDetails);

async function getStatements(req, res) {
    try {
        const result = await stmtBa.getStatements();
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Statements`);
    }
}

async function getStatementDetails(req, res) {
    if (!req.params['statementId']) {
        handleError(`Invalid Request`, res, `process statement-id`, 400);
        return;
    }

    const statementId = req.params['statementId'];
    try {
        const result = await stmtBa.getStatementDetails(statementId);
        if (!result) {
            handleError(new Error(`Statement Details not found for statementId ${statementId}`), res);
            return;
        }
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Statement Details of statementId ${statementId}`);
    }
}

module.exports = {router};