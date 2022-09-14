const { DynamoDB } = require('aws-sdk');
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-1'
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'Products';
const healthPath = '/health';
const sellerpath = '/productbyseller';
const bidderpath = '/productbybidder';

exports.handler = async function (event) {
    console.log('Request event: ', event);
    let response;
    switch (true) {
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = buildResponse(200);
            break;
        case event.httpMethod === 'GET' && event.path === sellerpath:
            response = await getproductbysellerid(event.queryStringParameters.sellerid);
            break;
        case event.httpMethod === 'GET' && event.path === bidderpath:
            response = await getproductbybidderid(event.queryStringParameters.bidderid);
            break;
        default:
            response = buildResponse(404, '404 Not Found');
    }
    return response;
}

async function getproductbysellerid(sellerid) {
    var allProducts = [];
    const params = {
        TableName: dynamodbTableName
      }
    
    allProducts = await scanDynamoRecords(params, []);
    var filteredProducts = [];
    for (let i = 0; i < allProducts.length; i++) {
        if (allProducts[i].sellerid === sellerid) {
            filteredProducts.push(allProducts[i])
        }
    }
    const body = {
        Operation: 'UPDATE',
        Message: 'SUCCESS',
        seller_products: filteredProducts
    }
    return buildResponse(200, body);
}

async function getproductbybidderid(bidderid) {
    var allProducts = [];
    const params = {
        TableName: dynamodbTableName
      }
    
    allProducts = await scanDynamoRecords(params, []);
    var filteredProducts = [];
    for (let i = 0; i < allProducts.length; i++) {
        if (allProducts[i].highestbidderid === bidderid) {
            filteredProducts.push(allProducts[i])
        }
    }
    const body = {
        Operation: 'UPDATE',
        Message: 'SUCCESS',
        bidder_products: filteredProducts
    }
    return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey) {
            scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch (error) {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    }
}

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