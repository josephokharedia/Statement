module.exports = class GetCategoriesPerYearResultTo {
    constructor(result) {
        this.date = new DateTo(result.date);
        this.categories = [];
        result.categories.forEach(c => this.categories.push(new CategoryTo(c)));
    }
};

class DateTo {
    constructor({year, month}) {
        this.year = year;
        this.month = month;
    }
}

class CategoryTo {
    constructor(category) {
        this.id = category._id;
        this.name = category.name;
        this.amount = category.amount;
        this.count = category.count;
    }
}