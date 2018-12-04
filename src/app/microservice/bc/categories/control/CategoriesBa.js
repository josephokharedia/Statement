/*
 * Categories Business adapter
 * Receives an instruction to get categories
 * Generates a mongodb aggregation query pipeline for Categories
 * Invokes Categories External Service interface to execute the pipeline
 */
const catEsi = require('../integration/CategoriesEsi');
const {toObjectId} = require('../../../shared/Utils');
const event = require('../../../shared/EventUtil');

async function getCategories() {
    try {
        return catEsi.getCategories();
    } catch (e) {
        throw e;
    }
}

async function getCategoryDetails(categoryId) {
    try {
        const result = await catEsi.getCategoryDetails(toObjectId(categoryId));
        if (result && result.length) {
            return result[0];
        } else {
            return [];
        }
    } catch (e) {
        throw e;
    }
}

async function createCategory(category) {
    if (!category) {
        throw Error(`Category cannot be null`);
    }

    if (!category.tags) {
        throw Error(`Category must have tags`);
    }
    category.regex = [];
    for (let i = 0; i < category.tags.length; i++) {
        category.regex.push(new RegExp([category.tags[i]].join(""), "i"));
    }

    try {
        const categoryId = await catEsi.createCategory(category);
        const createdCategory = await getCategoryDetails(toObjectId(categoryId));
        event.raise('CreatedCategory', createdCategory);
        return createdCategory;
    } catch (e) {
        throw e;
    }
}

async function updateCategory({categoryId}, category) {
    if (!category) {
        throw Error(`Category cannot be null`);
    }

    if (!category.tags) {
        throw Error(`Category must have tags`);
    }
    category.regex = [];
    for (let i = 0; i < category.tags.length; i++) {
        category.regex.push(new RegExp([category.tags[i]].join(""), "i"));
    }

    try {
        category._id = toObjectId(categoryId);
        const updatedCategory = await catEsi.updateCategory(category);
        event.raise('UpdatedCategory', updatedCategory);
        return updatedCategory;
    } catch (e) {
        throw e;
    }
}

async function deleteCategory({categoryId}) {
    if (!categoryId) {
        throw Error(`CategoryId cannot be null`);
    }

    try {
        const deletedCategory = await catEsi.deleteCategory(toObjectId(categoryId));
        event.raise('DeletedCategory', deletedCategory);
        return deletedCategory;
    } catch (e) {
        throw e;
    }
}

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};