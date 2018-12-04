/* Categories Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const {handleError} = require('../../../shared/Utils.js');
const router = express.Router();

const catBa = require('../control/CategoriesBa');
router.get('/', getCategories);
router.get('/summaryForYear', getCategoriesSummaryForYear);
router.get('/summaryForStatement', getCategoriesSummaryForStatement);
router.post('/', createCategory);
router.patch('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);

async function getCategories(req, res) {
    try {
        const result = await catBa.getCategories();
        res.send(result);
    } catch (e) {
        handleError(e, res, `Get Categories`);
    }
}

async function getCategoriesSummaryForYear(req, res) {
    try {
        const result = await catBa.getCategoriesSummaryForYear(req.query);
        res.send(result);
    } catch (e) {
        handleError(e, res, `Failed to get categories summary for year`);
    }
}

async function getCategoriesSummaryForStatement(req, res) {
    try {
        const result = await catBa.getCategoriesSummaryForStatement(req.query);
        res.send(result);
    } catch (e) {
        handleError(e, res, `Failed to get categories summary for statement`);
    }
}

async function createCategory(req, res) {
    try {
        const category = catBa.createCategory(req.body);
        res.send(category);
    } catch (e) {
        handleError(e, res, `Failed to create category`);
    }
}

async function updateCategory(req, res) {
    try {
        const category = catBa.updateCategory(req.param, req.body);
        res.send(category);
    } catch (e) {
        handleError(e, res, `Failed to update category`);
    }
}

async function deleteCategory(req, res) {
    try {
        const category = catBa.deleteCategory(req.params);
        res.send(category);
    } catch (e) {
        handleError(e, res, `Failed to delete category`);
    }
}

module.exports = {router};