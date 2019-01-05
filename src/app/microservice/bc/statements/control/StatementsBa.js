/*
 * Statements Business adapter
 * Receives an instruction to get statements
 * Generates a mongodb aggregation query pipeline for Statements
 * Invokes Statements External Service interface to execute the pipeline
 */
const {unwrapError, hashStatement} = require('../../../shared/Utils');
const stmtEsi = require('../integration/StatementsEsi');
const StatementEntity = require('../entity/StatementEntity');
const getStatementsPipeline = require('./pipeline/GetStatementsPipeline');
const getStatementDetailsPipeline = require('./pipeline/GetStatementDetailsPipeline');
const {toObjectId} = require('../../../shared/Utils.js');
const StatementTo = require('../control/transferobject/StatementTo');
const StatementDetailsTo = require('../control/transferobject/StatementDetailsTo');


async function getStatements(queryOptions) {
    const options = {};
    try {
        options.hashCode = queryOptions && queryOptions.hashCode;
        const pipeline = getStatementsPipeline(options);
        const dbStatements = await stmtEsi.getStatements(pipeline);
        return dbStatements.map(s => new StatementTo(s));
    } catch (e) {
        return unwrapError(`Failed to get statements`, e);
    }
}

async function getStatementDetails({statementId}) {
    try {
        if(!statementId) {
            throw Error(`Statement id cannot be empty`);
        }
        const pipeline = getStatementDetailsPipeline(toObjectId(statementId));
        const dbStatementDetails = await stmtEsi.getStatementDetails(pipeline);
        return new StatementDetailsTo(dbStatementDetails);
    } catch (e) {
        return unwrapError(`Failed to get statements`, e);
    }
}

async function createStatement(statement) {
    try {
        const statementEntity = new StatementEntity(statement);
        const dbStatements = await stmtEsi.getStatements([{$match: {hashCode: statementEntity.hashCode}}]);
        if (dbStatements && dbStatements.length) {
            console.debug(`Db Statement already exist`);
            return new StatementTo(dbStatements[0]);
        }
        const createdStatement = await stmtEsi.createStatement(statementEntity);
        return new StatementTo(createdStatement);
    } catch (e) {
        return unwrapError(`Failed to get statements`, e);
    }
}

module.exports = {getStatements, getStatementDetails, createStatement};