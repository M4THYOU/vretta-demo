const jwt = require('jsonwebtoken');

exports.handler = (event, context, callback) => {

    const date = Date();

    const token = jwt.sign({date: date}, 'justasamplesecret', {expiresIn: "4h"});

    console.log(token);

    const data = {
        eventType: "getJWT",
        Attributes: {
            token: token
        }
    };

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(data),
    });
};