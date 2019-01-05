/*
 * Send query instruction to mongodb and return return results from db
 */
const db = require('../../../shared/DbCollections');


async function getDrafts(pipeline) {
    try {
        const {draftsDb} = await db;
        const docs = await draftsDb.aggregate(pipeline).toArray();
        if (docs.length === 0) {
            return [];
        } else {
            return docs;
        }
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

async function deleteDraft(draftId) {
    try {
        const {draftsDb} = await db;
        const {value} = await draftsDb.findOneAndDelete({_id: draftId});
        return value;
    } catch (e) {
        throw e;
    }
}

module.exports = {getDrafts, saveDraft, deleteDraft};