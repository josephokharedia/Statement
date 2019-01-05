const {toObjectId} = require('../../microservice/shared/Utils');

module.exports = [
    {
        _id: toObjectId(1),
        attachment: `
        2,123456,MR JOE SOAP,NEW DRAFT STATEMENT\n
        3,01,'01 January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Test Statement","Transaction 01","",100.00,1000.00,\n
        5,2,'02 Jan',"Test Statement","Transaction 02","",-200.00,1000.00,\n
        5,3,'01 Feb',"Test Statement","Transaction 03","",300.00,-1000.00,\n
        `,
        institution: 'FNB',
        filename: 'File1.csv'
    },
    {
        _id: toObjectId(2),
        attachment: `
        2,100,MR JOE SOAP,DRAFT WITH EXISTING STATEMENT\n
        3,01,'01 January 2018', '01 February 2018'\n
        5,1,'01 Jan',"Test description 1","","",-100.00,1000.00,\n
        5,2,'02 Jan',"Test description 2","","",-200.00,900.00,\n
        5,3,'03 Jan',"Test description 3","","",-300.00,800.00,\n
        `,
        institution: 'FNB',
        filename: 'File2.csv'
    },
];