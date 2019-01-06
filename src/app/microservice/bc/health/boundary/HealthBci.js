const express = require('express');
const healthBa = require('../control/HealthBa');

const router = express.Router();
router.get('/', checkHealth);


async function checkHealth(req, res) {
    const result = await healthBa.checkHealth();
    res.status(result.error ? 500 : 200).send(result);
}

module.exports = {router};