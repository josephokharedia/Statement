/*
 * Categories Business adapter
 * Receives an instruction to get categories
 * Generates a mongodb aggregation query pipeline for Categories
 * Invokes Categories External Service interface to execute the pipeline
 */
const catEsi = require('../integration/CategoriesEsi');
const {toObjectId, unwrapError} = require('../../../shared/Utils');
const event = require('../../../shared/EventUtil');
const CategoryEntity = require('../entity/CategoryEntity');
const CategoryTo = require('../control/transferobject/CategoryTo');

async function getCategories() {
    try {
        const dbCategories = await catEsi.getCategories();
        return dbCategories.map(c => new CategoryTo(c));
    } catch (e) {
        return unwrapError(`Failed to get categories`, e);
    }
}

async function createCategory(category) {
    try {
        const categoryEntity = new CategoryEntity(category);
        const createdDbCategory = await catEsi.createCategory(categoryEntity);
        const categoryTo = new CategoryTo(createdDbCategory);
        event.raise('CreatedCategory', categoryTo);
        return categoryTo;
    } catch (e) {
        return unwrapError(`Failed to create categories`, e);
    }
}

async function updateCategory({categoryId}, category) {
    try {
        if (!categoryId) {
            throw Error(`CategoryId cannot be empty`);
        }
        const categoryEntity = new CategoryEntity(category);
        const updatedDbCategory = await catEsi.updateCategory(categoryEntity, toObjectId(categoryId));
        const categoryTo = new CategoryTo(updatedDbCategory);
        event.raise('UpdatedCategory', categoryTo);
        return categoryTo;
    } catch (e) {
        return unwrapError(`Failed to update categories`, e);
    }
}

async function deleteCategory({categoryId}) {
    try {
        if (!categoryId) {
            throw Error(`CategoryId cannot be empty`);
        }
        const deletedDbCategory = await catEsi.deleteCategory(toObjectId(categoryId));
        const categoryTo = new CategoryTo(deletedDbCategory);
        event.raise('DeletedCategory', categoryTo);
        return categoryTo;
    } catch (e) {
        return unwrapError(`Failed to delete categories`, e);
    }
}

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};