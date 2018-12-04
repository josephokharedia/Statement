/* Institutions Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const {handleError} = require('../../../shared/Utils.js');
const router = express.Router();

const instEsi = require('../integration/InstitutionsEsi');
router.get('/', getInstitutions);

async function getInstitutions(req, res) {
    try {
        const result = await instEsi.getInstitutions();
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Institutions`);
    }
}

module.exports = {router};