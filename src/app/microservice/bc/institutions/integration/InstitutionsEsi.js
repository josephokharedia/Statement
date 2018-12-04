/*
 * Send query instruction to mongodb and return return results from db
 */
const db = require('../../../shared/DbCollections');

async function getInstitutions() {
    try {
        const {statementsDb} = await db;
        return statementsDb.distinct('institution');
    } catch (e) {
        throw e;
    }
}

module.exports = {getInstitutions};