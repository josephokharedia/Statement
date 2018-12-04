module.exports = function getStatements() {

    return [
        {
            $project: {
                raw: 0,
                id: 0
            }
        }, {
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
            $project: {
                "transactions._id": 0,
                "transactions.statement": 0,
                "transactions.tags": 0,
                "transactions.categories": 0
            }
        }, {
            $sort: {
                "transactions.date": 1,
                "transactions._id": 1
            }
        }, {
            $group: {
                _id: {
                    id: "$_id",
                    accountNumber: "$accountNumber",
                    accountDescription: "$accountDescription",
                    institution: "$institution",
                    statementNumber: "$statementNumber"
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
                _id: 0,
                id: "$_id.id",
                accountNumber: "$_id.accountNumber",
                accountDescription: "$_id.accountDescription",
                institution: "$_id.institution",
                openingBalance: 1,
                closingBalance: 1,
                totalCredit: 1,
                totalDebit: 1,
                fromDate: 1,
                toDate: 1,
                statementNumber: "$_id.statementNumber"
            }
        }, {
            $sort: {
                fromDate: 1
            }
        }
    ];
};