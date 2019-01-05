/*
 * Send query instruction to mongodb and return return results from db
 */
const SUPPORTED_INSTITUTIONS = ['FNB', 'NEDBANK'];

async function getInstitutions() {
    try {
        return SUPPORTED_INSTITUTIONS;
    } catch (e) {
        throw e;
    }
}

module.exports = {getInstitutions};