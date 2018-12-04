module.exports = function searchTransactionDescriptionPipeline(q) {
    return [
        {
            $match: {description: {$regex: `${q}`, $options: 'i'}}

        },
        {
            $limit: 10
        },
        {
            $project: {_id: 0, description: 1}
        }

    ];
};

