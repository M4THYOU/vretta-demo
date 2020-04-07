const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    let body = JSON.parse(event.body);
    const playerId = body.data.uid;
    const gameId = body.data.gameId;

    const socketId = event.requestContext.connectionId;

    console.log("playerId:", playerId);
    console.log("gameId:", gameId);
    console.log("socketId:", socketId);

    // Add/Update the player item with new socketId.
    const playerParams = {
        "TableName": "players",
        "Item": {
            "playerId": playerId,
            "socketId": socketId,
            "currentGame": gameId,
        },
        "ReturnValues": "NONE" // empty when creating a new item.
    }

    DDB.put(playerParams, function(err, data) {
        if (err) {

            const err_s = JSON.stringify(err);

            console.log(err_s);

            callback(null, {
                statusCode: 500,
                body: "player: Failed to connect: " + err_s
            });

        } else {
            console.log("Player successfully added/updated.");

            // find the game from the id.
            // // add to players list. DONE
            // // update socketIds. DONE
            // // check if player has a field in messages. Otherwise, add one DONE
            // // set isActive field for current player to true.

            const updateParams = {
                "TableName": "games",
                "Key": {
                    "gameId": gameId
                },
                "UpdateExpression": "add players :x set socketIds.#player = :socket, messages.#player = if_not_exists(messages.#player, :empty_list), isActive.#player = :active",
                "ExpressionAttributeNames": {
                    "#player": playerId
                },
                "ExpressionAttributeValues": {
                    ":x": DDB.createSet([playerId]),
                    ":socket": socketId,
                    ":empty_list": [],
                    ":active": true
                },
                "ReturnValues": "ALL_NEW"
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

                    // Combine these into two.
                    // update playerlist and active status at the same time.
                    // // EMIT to the coach there is a new player online, from their socketId
                    // // EMIT to the coach that the player changed connection.
                    const coachSocketId = data.Attributes.coachSocketId;

                    const API = new AWS.ApiGatewayManagementApi({endpoint: event.requestContext.domainName + "/" + event.requestContext.stage});

                    const coachData = {
                        "eventType": "playerUpdate",
                        "playerList": data.Attributes.players,
                        "currPlayer": playerId,
                        "isActive": true
                    };

                    const coachParams = {
                        "ConnectionId": coachSocketId,
                        "Data": JSON.stringify(coachData)
                    }

                    // get data to return to player.
                    // gameId, coachId, their chat.
                    const gameId = data.Attributes.gameId;
                    const coachId = data.Attributes.coachId;
                    const chat = data.Attributes.messages[playerId];

                    const returnData = {
                        "eventType": 'getGame',
                        "Attributes": {
                            "gameId": gameId,
                            "coachId": coachId,
                            "chat": chat
                        }
                    }

                    console.log("!!!:", data);

                    API.postToConnection(coachParams, function(err, postData) {
                        if (err) {
                            const err_s = JSON.stringify(err);

                            if (err.statusCode == 410) { // a "GoneException", means coach is not in the game.
                                callback(null, {
                                    statusCode: 200,
                                    body: JSON.stringify(returnData)
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
                                body: JSON.stringify(returnData)
                            });
                        }
                    });

                }
            });

        }
    });

};
