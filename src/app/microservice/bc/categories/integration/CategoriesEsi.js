/*
 * Send query instruction to mongodb and return return results from db
 */
const db = require('../../../shared/DbCollections');

async function getCategories() {
    try {

        const {categoriesDb} = await db;
        return categoriesDb.find({}).toArray();
    } catch (e) {
        throw e;
    }
}

async function createCategory(category) {
    try {
        const {categoriesDb} = await db;
        const {ops} = await categoriesDb.insertOne(category);
        return ops[0];
    } catch (e) {
        throw e;
    }
}

async function getCategoryDetails(categoryId) {
    try {
        const {categoriesDb} = await db;
        return categoriesDb.find({_id: categoryId}).toArray();
    } catch (e) {
        throw e;
    }
}

async function updateCategory(category, categoryId) {
    try {
        const {categoriesDb} = await db;
        const {value} = await categoriesDb.findOneAndUpdate(
            {_id: categoryId},
            {$set: {name: category.name, tags: category.tags, regex: category.regex}},
            {returnOriginal: false}
        );
        return value;
    } catch (e) {
        throw e;
    }
}

async function deleteCategory(categoryId) {
    try {
        const {categoriesDb} = await db;
        const {value} = await categoriesDb.findOneAndDelete({_id: categoryId});
        return value;
    } catch (e) {
        throw e;
    }
}

module.exports = {
    getCategories,
    getCategoryDetails,
    createCategory,
    updateCategory,
    deleteCategory
};