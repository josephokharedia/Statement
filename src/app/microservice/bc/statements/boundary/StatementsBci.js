/* Statements Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const router = express.Router();

const stmtBa = require('../control/StatementsBa');
router.get('/', getStatements);
router.get('/:statementId', getStatementDetails);

async function getStatements(req, res) {
    const result = await stmtBa.getStatements();
    res.status(result.error? 500 : 200).send(result);
}

async function getStatementDetails(req, res) {
    const result = await stmtBa.getStatementDetails(req.params);
    res.status(result.error? 500 : 200).send(result);
}

module.exports = {router};