const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    let body = JSON.parse(event.body);
    const playerId = body.data.playerId;
    const unread = body.data.unread;
    const gameId = body.data.gameId;

    const updateParams = {
        "TableName": "games",
        "Key": {
            "gameId": gameId
        },
        "UpdateExpression": "set hasUnread.#player = :unread",
        "ExpressionAttributeNames": {
            "#player": playerId
        },
        "ExpressionAttributeValues": {
            ":unread": unread
        },
        "ReturnValues": "NONE"
    }

    DDB.update(updateParams, function(err, data) {
        if (err) {
            const err_s = JSON.stringify(err);
            console.log(err_s);
            callback(null, {
                statusCode: 500,
                body: "game: Failed to connect: " + err_s
            });
        } else {
            console.log("Successfully updated unread.");
        }
    });

};