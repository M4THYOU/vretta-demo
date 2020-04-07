const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    // let event_s = JSON.stringify(event);

    let body = JSON.parse(event.body);
    const gameId = body.data.gameId;
    const connectionId = event.requestContext.connectionId;

    console.log("coachId:", gameId);
    console.log(event.requestContext);

    // set coachSocketId in the game.
    // return the game.
    console.log("connectionId:", connectionId);

    const updateParams = {
        "TableName": "games",
        "Key": {
            "gameId": gameId
        },
        "UpdateExpression": "set coachSocketId = :x",
        "ExpressionAttributeValues": {
            ":x": connectionId
        },
        "ReturnValues": "ALL_NEW"
    };


    DDB.update(updateParams, function(err, data) {
        if (err) {

            const err_s = JSON.stringify(err);

            console.log(err_s);

            callback(null, {
                statusCode: 500,
                body: "Failed to connect: " + err_s
            });

        } else {

            console.log(data);
            data['eventType'] = 'gameData';

            callback(null, {
                statusCode: 200,
                body: JSON.stringify(data)
            });

        }
    });

};

