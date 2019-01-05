module.exports = class GetCategoriesPerStatementResultTo {
    constructor(result) {
        this.id = result._id;
        this.name = result.name;
        this.amount = result.amount;
        this.count = result.count;
    }
};