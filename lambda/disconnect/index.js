const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    const connectionId = event.requestContext.connectionId;

    console.log('ConnectionId;', connectionId);

    const getParams = {
        "TableName": "players",
        "Key": {
            "socketId": connectionId
        }
    };

    DDB.delete(getParams, function (err, data) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log(data);
            const playerId = data.Item.playerId;
            const gameId = data.Item.currentGame;

            const updateParams = {
                "TableName": "games",
                "Key": {
                    "gameId": gameId
                },
                "UpdateExpression": "set isActive.#player = :active",
                "ExpressionAttributeNames": {
                    "#player": playerId
                },
                "ExpressionAttributeValues": {
                    ":active": false,
                },
                "ReturnValues": "ALL_NEW"
            }

            DDB.update(updateParams, function(err, data) {
                if (err) {
                    console.log("Update Error:", JSON.stringify(err));
                } else {
                    console.log("Successfully updated.");

                    const coachSocketId = data.Attributes.coachSocketId;
                    const API = new AWS.ApiGatewayManagementApi({endpoint: event.requestContext.domainName + "/" + event.requestContext.stage});

                    const updateData = {
                        "eventType": "playerChangeConnection",
                        "Attributes": {
                            "isActive": false,
                            "playerId": playerId
                        }
                    };

                    const activeParams = {
                        "ConnectionId": coachSocketId,
                        "Data": JSON.stringify(updateData)
                    };

                    API.postToConnection(activeParams, function(err, postData) {
                        if (err) {
                            const err_s = JSON.stringify(err);

                            console.log(err_s);
                        } else {
                            console.log("Successfully notified.");
                        }
                    });

                }
            });



        }
    });

};
