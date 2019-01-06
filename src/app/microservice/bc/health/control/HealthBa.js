/*
 * Categories Business adapter
 * Receives an instruction to check health
 * Ensures the application is running and integrated to db
 */
const catBa = require('../../categories/control/CategoriesBa');
const {unwrapError} = require('../../../shared/Utils');

async function checkHealth() {
    try {
        return catBa.getCategories();
    } catch (e) {
        return unwrapError(`Failed to integrate with database`, e);
    }
}

module.exports = {checkHealth};
