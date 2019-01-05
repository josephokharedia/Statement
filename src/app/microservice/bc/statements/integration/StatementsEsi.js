/*
 * Send query instruction to mongodb and return return results from db
 */
const db = require('../../../shared/DbCollections');
const {toObjectId} = require("../../../shared/Utils");

async function getStatements(pipeline) {
    try {
        const {statementsDb} = await db;
        const docs = await statementsDb.aggregate(pipeline).toArray();
        if (docs.length === 0) {
            return [];
        } else {
            return docs;
        }
    } catch (e) {
        throw e;
    }
}

async function getStatementDetails(pipeline) {
    try {
        const {statementsDb} = await db;
        const docs = await statementsDb.aggregate(pipeline).toArray();
        return docs[0];
    } catch (e) {
        throw e;
    }
}

async function createStatement(statement) {
    try {
        const {statementsDb} = await db;
        const {ops} = await statementsDb.insertOne(statement);
        return ops[0];
    } catch (e) {
        throw e;
    }
}

module.exports = {getStatements, getStatementDetails, createStatement};