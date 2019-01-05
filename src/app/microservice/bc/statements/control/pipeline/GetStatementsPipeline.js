module.exports = function getStatements(options) {
    const matchQuery = [{}];

    if (options.hashCode) {
        matchQuery.push({hashCode: options.hashCode});
    }

    const match = {$match: {$and: [...matchQuery]}};
    return [
        match,
        {
            $lookup: {
                from: 'transactions',
                localField: '_id',
                foreignField: 'statement',
                as: 'transactions'
            }
        }, {
            $unwind: {
                path: "$transactions"
            }
        }, {
            $sort: {
                "transactions.date": 1,
                "transactions._id": 1
            }
        }, {
            $group: {
                _id: {
                    _id: "$_id",
                    accountNumber: "$accountNumber",
                    accountDescription: "$accountDescription",
                    institution: "$institution",
                    statementNumber: "$statementNumber",
                    hashCode: "$hashCode",
                    attachment: "$attachment"
                },
                openingBalance: {
                    $first: "$transactions.balance"
                },
                closingBalance: {
                    $last: "$transactions.balance"
                },
                fromDate: {
                    $first: "$transactions.date"
                },
                toDate: {
                    $last: "$transactions.date"
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            {
                                $gte: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions.amount", 0
                        ]
                    }
                },
                totalDebit: {
                    $sum: {
                        $cond: [
                            {
                                $lte: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions.amount", 0
                        ]
                    }
                }
            }
        }, {
            $project: {
                _id: "$_id._id",
                accountNumber: "$_id.accountNumber",
                accountDescription: "$_id.accountDescription",
                institution: "$_id.institution",
                statementNumber: '$_id.statementNumber',
                hashCode: '$_id.hashCode',
                attachment: '$_id.attachment',
                openingBalance: 1,
                closingBalance: 1,
                totalCredit: 1,
                totalDebit: 1,
                fromDate: 1,
                toDate: 1,
            }
        }, {
            $sort: {
                fromDate: 1
            }
        }
    ];
};