const {escapeRegExp} = require('../../../shared/Utils');
module.exports = class CategoryEntity {
    constructor(category) {
        this.validate(category);
        this.name = category.name;
        this.tags = category.tags;
        this.regex = [];
        for (let i = 0; i < this.tags.length; i++) {
            this.regex.push(new RegExp(escapeRegExp(this.tags[i]), "i"));
        }
    }

    validate({name, tags}) {
        const nameIsValid = (typeof name === 'string') && name.trim().length;
        const tagsIsValid = tags && tags.length;
        if (!nameIsValid) {
            throw Error(`Error creating CategoryEntity. Incorrect category name`);
        }
        if (!tagsIsValid) {
            throw Error(`Error creating CategoryEntity. Incorrect category tags`);
        }
    }
};