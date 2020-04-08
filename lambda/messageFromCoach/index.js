const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    let body = JSON.parse(event.body);
    console.log(body.data);

    const coachId = body.data.coachId;
    const playerId = body.data.playerId;
    const msg = body.data.message;
    const gameId = body.data.gameId;

    console.log("coachId:", coachId);
    console.log("playerId:", playerId);
    console.log("msg:", msg);
    console.log("gameId:", gameId);

    const msgObj = {
        "msg": msg,
        "sender": coachId,
        "isBroadcast": false,
        "date": Date()
    };

    const updateParams = {
        "TableName": "games",
        "Key": {
            "gameId": gameId
        },
        "UpdateExpression": "set messages.#player = list_append(messages.#player, :new_message)",
        "ExpressionAttributeNames": {
            "#player": playerId
        },
        "ExpressionAttributeValues": {
            ":new_message": [msgObj],
        },
        "ReturnValues": "ALL_NEW"
    };

    DDB.update(updateParams, function(err, data) {
        if (err) {
            const err_s = JSON.stringify(err);
            console.log(err_s);
            callback(null, {
                statusCode: 500,
                body: "game: Failed to connect: " + err_s
            });
        } else {

            const playerSocketId = data.Attributes.socketIds[playerId];
            const API = new AWS.ApiGatewayManagementApi({endpoint: event.requestContext.domainName + "/" + event.requestContext.stage});

            const coachData = {
                "eventType": "message",
                "Attributes": {
                    "message": msgObj
                }
            };

            const coachParams = {
                "ConnectionId": playerSocketId,
                "Data": JSON.stringify(coachData)
            };


            API.postToConnection(coachParams, function(err, postData) {
                if (err) {
                    const err_s = JSON.stringify(err);

                    if (err.statusCode == 410) { // a "GoneException", means coach is not in the game.
                        callback(null, {
                            statusCode: 200,
                            body: JSON.stringify(data)
                        });
                    }

                    console.log(err_s);
                    callback(null, {
                        statusCode: 500,
                        body: "coach_push: Failed to connect: " + err_s
                    });
                } else {
                    callback(null, {
                        statusCode: 200,
                        body: JSON.stringify(data)
                    });
                }
            });

        }
    });

};
