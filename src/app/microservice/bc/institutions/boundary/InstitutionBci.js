/* Institutions Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const router = express.Router();

const instBa = require('../control/InstitutionsBa');
router.get('/', getInstitutions);

async function getInstitutions(req, res) {
        const result = await instBa.getInstitutions();
        res.status(result.error? 500 : 200).send(result);
}

module.exports = {router};