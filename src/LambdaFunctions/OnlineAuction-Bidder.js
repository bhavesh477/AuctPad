const { DynamoDB } = require('aws-sdk');
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-1'
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'Products';
const healthPath = '/health';
const bidPath = '/bid';

exports.handler = async function (event) {
    console.log('Request event: ', event);
    let response;
    switch (true) {
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = buildResponse(200);
            break;
        // case event.httpMethod === 'POST' && event.path === usersPath:
        //     response = await saveUser(JSON.parse(event.body));
        //     break;
        // case event.httpMethod === 'GET' && event.path === usersPath:
        //     response = await getUserById(event.queryStringParameters.userId);
        //     break;
        case event.httpMethod === 'PUT' && event.path === bidPath:
            const requestBody = JSON.parse(event.body);
            response = await placeBidByproductID(event.queryStringParameters.productId, requestBody.highestbid, requestBody.highestbidderid, requestBody.sold);
            break;
        default:
            response = buildResponse(404, '404 Not Found');
    }
    return response;
}

async function placeBidByproductID(productId, highestbid, highestbidderid, sold) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'productId': productId
        },

        UpdateExpression: `set highestbid = :highestbid, highestbidderid = :highestbidderid, sold = :sold`,

        ExpressionAttributeValues: {
            ':highestbid': highestbid,
            ':highestbidderid': highestbidderid,
            ':sold': sold,   
        },

        ReturnValues: 'UPDATED_NEW'
    
    }
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'UPDATE',
            Message: 'SUCCESS',
            UpdatedAttributes: response
          }
        return buildResponse(200, body);
    }, (error) => {
        console.error("Unable to record the bid", error);
    })
}

// async function getUserById(userId) {
//     const params = {
//         TableName: dynamodbTableName,
//         Key: {
//             'userId': userId
//         }
//     }
//     return await dynamodb.get(params).promise().then((response) => {
//         return buildResponse(200, response.Item);
//     }, (error) => {
//         console.error("Unable to fetch the user", error);
//     })
// }


// async function saveUser(requestBody) {
//     const params = {
//         TableName: dynamodbTableName,
//         Item: requestBody
//     }
//     return await dynamodb.put(params).promise().then(() => {
//         const body = {
//             Operation: 'SAVE',
//             Message: 'SUCCESS',
//             Item: requestBody
//         }
//         return buildResponse(200, body);
//     }, (error) => {
//         console.error('Error while saving user', error)
//     })
// }


function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*"
        },
        body: JSON.stringify(body)
    }
}