const crypto = require("crypto");
const AWS = require("aws-sdk");

const DDB = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    let event_s = JSON.stringify(event);

    let body = JSON.parse(event.body);
    const coachId = body.data.coachId;
    const gameId = crypto.randomBytes(3).toString('hex');

    console.log("coachId:", coachId);
    console.log("gameId:", gameId);

    const params = {
        "TableName": "games",
        "Item": {
            "gameId": gameId,
            "date": new Date().toString(),
            "coachId": coachId,

            // players must be a unique string set
            // prepopulated with 'placholder' because set infers its type.
            // Can't use '' as a placeholder, because not allowed.
            "players": DDB.createSet(['placeholder']),

            "messages": {},
            "socketIds": {},
            "isActive": {},
            "hasUnread": {},
            "broadcasts": []
        },
        "ReturnValues": "ALL_OLD" // empty when creating a new item.
    }

    DDB.put(params, function(err, data) {
        if (err) {

            const err_s = JSON.stringify(err);

            console.log(err_s);

            callback(null, {
                statusCode: 500,
                body: "Failed to connect: " + err_s
            });

        } else {

            console.log(data);
            data['eventType'] = 'createGame';
            data['gameId'] = gameId;

            callback(null, {
                statusCode: 200,
                body: JSON.stringify(data)
            });

        }
    });

};
