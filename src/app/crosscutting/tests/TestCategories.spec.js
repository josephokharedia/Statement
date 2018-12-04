const sinon = require('sinon');
const {expect, assert} = require('chai');
const catBa = require('../../microservice/bc/categories/control/CategoriesBa');
const catEsi = require('../../microservice/bc/categories/integration/CategoriesEsi');
const createTestDatabase = require('./CreateTestDatabase.spec');
const {toObjectId} = require('../../microservice/shared/Utils');
const event = require('../../microservice/shared/EventUtil');


describe('Get Categories', function () {
    beforeEach(createTestDatabase);

    it('should return all categories', async () => {
        const categories = await catBa.getCategories();
        expect(categories).to.have.deep.nested.property('0._id').eql(toObjectId(1));
        expect(categories).to.have.deep.nested.property('0.name', 'Category 1');
        expect(categories).to.have.deep.nested.property('0.tags.0', 'Category 1');
        expect(categories).to.have.deep.nested.property('0.regex.0', /Category 1/i);
        expect(categories).to.have.deep.nested.property('1._id').eql(toObjectId(2));
        expect(categories).to.have.deep.nested.property('1.name', 'Category 2');
        expect(categories).to.have.deep.nested.property('1.tags.0', 'Category 2');
        expect(categories).to.have.deep.nested.property('1.regex.0', /Category 2/i);
        expect(categories).to.have.deep.nested.property('2._id').eql(toObjectId(3));
        expect(categories).to.have.deep.nested.property('2.name', 'Category 3');
        expect(categories).to.have.deep.nested.property('2.tags.0', 'Category 3');
        expect(categories).to.have.deep.nested.property('2.regex.0', /Category 3/i);
    });
});

describe('Create Category', function () {
    const createdCategoryEventHandlerSpy = sinon.spy();
    let createdCategory;
    before(async function () {
        await createTestDatabase();
        event.on('CreatedCategory', createdCategoryEventHandlerSpy);
    });

    it('should add category successfully', async function () {
        const category = {
            _id: toObjectId(4),
            name: 'Category 4',
            tags: ['Category 4', 'Category 04', 'Category four'],
        };

        createdCategory = await catBa.createCategory(category);
        const categories = await catBa.getCategories();
        expect(categories).to.have.lengthOf(4);
        expect(createdCategory).to.have.deep.nested.property('_id').eql(toObjectId(4));
        expect(createdCategory).to.have.deep.nested.property('name', 'Category 4');
        expect(createdCategory).to.have.deep.nested.property('tags.0', 'Category 4');
        expect(createdCategory).to.have.deep.nested.property('tags.1', 'Category 04');
        expect(createdCategory).to.have.deep.nested.property('tags.2', 'Category four');
        expect(createdCategory).to.have.deep.nested.property('regex.0', /Category 4/i);
        expect(createdCategory).to.have.deep.nested.property('regex.1', /Category 04/i);
        expect(createdCategory).to.have.deep.nested.property('regex.2', /Category four/i);
    });
    it('should raise CreatedCategory event', function () {
        assert(createdCategoryEventHandlerSpy.withArgs(createdCategory).calledOnce);
    })
});

describe('Update Category', function () {
    const updatedCategoryEventHandlerSpy = sinon.spy();
    let updatedCategory;
    before(async function () {
        await createTestDatabase();
        event.on('UpdatedCategory', updatedCategoryEventHandlerSpy);
    });

    it('should update category successfully', async function () {
        const category = {
            name: 'Category 03',
            tags: ['Category 3', 'Category 03', 'Category three'],
        };

        const query = {categoryId: 3};
        updatedCategory = await catBa.updateCategory(query, category);
        const categories = await catBa.getCategories();
        expect(categories).to.have.lengthOf(3);
        expect(updatedCategory).to.have.deep.nested.property('_id').eql(toObjectId(3));
        expect(updatedCategory).to.have.deep.nested.property('name', 'Category 03');
        expect(updatedCategory).to.have.deep.nested.property('tags.0', 'Category 3');
        expect(updatedCategory).to.have.deep.nested.property('tags.1', 'Category 03');
        expect(updatedCategory).to.have.deep.nested.property('tags.2', 'Category three');
        expect(updatedCategory).to.have.deep.nested.property('regex.0', /Category 3/i);
        expect(updatedCategory).to.have.deep.nested.property('regex.1', /Category 03/i);
        expect(updatedCategory).to.have.deep.nested.property('regex.2', /Category three/i);
    });
    it('should raise UpdatedCategory event', function () {
        assert(updatedCategoryEventHandlerSpy.withArgs(updatedCategory).calledOnce);
    })
});


describe('Delete Category', function () {
    const deletedCategoryEventHandlerSpy = sinon.spy();
    let deletedCategory;
    before(async function () {
        await createTestDatabase();
        event.on('DeletedCategory', deletedCategoryEventHandlerSpy);
    });

    it('should delete category successfully', async function () {
        const category = {
            name: 'Category 03',
            tags: ['Category 3', 'Category 03', 'Category three'],
        };

        const query = {categoryId: 1};
        deletedCategory = await catBa.deleteCategory(query);
        const categories = await catBa.getCategories();
        expect(categories).to.have.lengthOf(2);
        expect(deletedCategory).to.have.deep.nested.property('_id').eql(toObjectId(1));
        expect(categories.map(c => c.name)).to.not.include('Category 1');

    });
    it('should raise DeletedCategory event', function () {
        assert(deletedCategoryEventHandlerSpy.withArgs(deletedCategory).calledOnce);
    })
});

