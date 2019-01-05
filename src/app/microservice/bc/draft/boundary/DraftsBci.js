/* Draft Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const draftBa = require('../control/DraftsBa');

const router = express.Router();
router.get('/', getDrafts);
router.get('/:draftId', getDraft);
router.delete('/:draftId', deleteDraft);
router.post('/', createDraft);
router.post('/approve/:draftId', approveDraft);

async function getDrafts(req, res) {
    const result = await draftBa.getDrafts();
    res.status(result.error ? 500 : 200).send(result);
}

async function createDraft(req, res) {
    const result = await draftBa.createDraft(req);
    res.status(result.error ? 500 : 200).send(result);
}

async function getDraft(req, res) {
    const result = await draftBa.getDraft(req.params);
    res.status(result.error ? 500 : 200).send(result);
}

async function deleteDraft(req, res) {
    const result = await draftBa.deleteDraft(req.params);
    res.status(result.error ? 500 : 200).send(result);
}

async function approveDraft(req, res) {
    const result = await draftBa.approveDraft(req.params);
    res.status(result.error ? 500 : 200).send(result);
}

module.exports = {router};