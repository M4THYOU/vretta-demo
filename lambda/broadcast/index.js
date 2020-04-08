const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    let body = JSON.parse(event.body);
    console.log(body.data);

    const msg = body.data.message;
    const gameId = body.data.gameId;
    const coachId = body.data.coachId;

    console.log("msg:", msg);
    console.log("gameId:", gameId);

    const getParams = {
        "TableName": "games",
        "Key": {
            "gameId": gameId
        }
    };

    const msgObj = {
        "msg": msg,
        "sender": coachId,
        "isBroadcast": true,
        "date": Date()
    };

    DDB.get(getParams, function(err, data) {
        if (err) {
            const err_s = JSON.stringify(err);
            console.log(err_s);
            callback(null, {
                statusCode: 500,
                body: "coach_push: Failed to connect: " + err_s
            });
        } else {
            const API = new AWS.ApiGatewayManagementApi({endpoint: event.requestContext.domainName + "/" + event.requestContext.stage});

            const messageData = {
                "eventType": "broadcast",
                "Attributes": {
                    "message": msgObj
                }
            };

            for (let key of Object.keys(data.Item.messages)) {
                console.log(key, data.Item.messages[key]);

                const playerParams = {
                    "ConnectionId": data.Item.socketIds[key],
                    "Data": JSON.stringify(messageData)
                };


                API.postToConnection(playerParams, function(err, postData) {
                    if (err) {
                        console.log(JSON.stringify(err));
                    } else {
                        console.log("Successfully broadcasted to", key);
                    }
                });

                data.Item.messages[key].push(msgObj);
            }

            console.log(data.Item.messages);

            const updateParams = {
                "TableName": "games",
                "Key": {
                    "gameId": gameId
                },
                "UpdateExpression": "set messages = :newMessages, broadcasts = list_append(broadcasts, :new_msg)",
                "ExpressionAttributeValues": {
                    ":newMessages": data.Item.messages,
                    ":new_msg": [msgObj]
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
                    callback(null, {
                        statusCode: 200,
                        body: JSON.stringify(data)
                    });
                }
            });

        }
    });

};
