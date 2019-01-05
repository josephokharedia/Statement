/* Categories Business component interface
 * Exports an express router for handling Rest calls
 */

const express = require('express');
const catBa = require('../control/CategoriesBa');

const router = express.Router();
router.get('/', getCategories);
router.post('/', createCategory);
router.patch('/:categoryId', updateCategory);
router.delete('/:categoryId', deleteCategory);

async function getCategories(req, res) {
    const result = await catBa.getCategories();
    res.status(result.error? 500 : 200).send(result);
}

async function createCategory(req, res) {
    const category = await catBa.createCategory(req.body);
    res.status(category.error? 500 : 200).send(category);
}

async function updateCategory(req, res) {
    const category = await catBa.updateCategory(req.params, req.body);
    res.status(category.error? 500 : 200).send(category);
}

async function deleteCategory(req, res) {
    const category = await catBa.deleteCategory(req.params);
    res.status(category.error? 500 : 200).send(category);
}

module.exports = {router};