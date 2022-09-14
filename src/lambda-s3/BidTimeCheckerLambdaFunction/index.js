// const axios = require('axios')
// import fetch from "node-fetch";
// const fetch = require('node-fetch')

const AWS = require('aws-sdk');
// const requests = require('requests')
const { error } = require('console');
const { callbackify } = require('util');
// const { DynamoDB } = require('aws-sdk');
var lambda = new AWS.Lambda({
  region: 'us-east-1'
})

AWS.config.update({
    region: 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'Products';
const publishEmailAPI = 'https://dec7ccapye.execute-api.us-east-1.amazonaws.com/prod/email/send-email';

exports.handler = async (event, ctx, callback) => {
  let currentTime = new Date().getTime();
  currentTime = Number(currentTime);
  
  console.log('currentTime', currentTime);

  let scannedItems = [];

  const params = {
    TableName: dynamodbTableName
  }
  
// 14400000 milliseconds = 4 hours
// 120000 = 2 mins
  
  var allProducts = [];
  allProducts = await scanDynamoRecords(params, []);
  var filteredProducts = [];
  for (let i = 0; i < allProducts.length; i++) {
    if (allProducts[i].sold === false && String(allProducts[i].timeathighestbid).length > 0) {
      console.log('allProducts[i].timeathighestbid', allProducts[i].timeathighestbid);
      console.log('allProducts[i].timeathighestbid.length', String(allProducts[i].timeathighestbid).length);
      console.log(currentTime - (Number(allProducts[i].timeathighestbid)));
      if (currentTime - (Number(allProducts[i].timeathighestbid)) >= 14400000)
        filteredProducts.push(allProducts[i])
    }
  }
  
  console.log('filteredProducts.length', filteredProducts.length)
  console.log(filteredProducts);
  
  for (let i = 0; i < filteredProducts.length; i++) {
    
    markProductSold(filteredProducts[i].productId, currentTime)
        
  
    lambda.invoke({
      FunctionName:'send-email',
      Payload:JSON.stringify({
          "topicName": filteredProducts[i].sellerid,
          "subject": "Your " + filteredProducts[i].name + " Sold !!!",
          "emailBody": "Your " + filteredProducts[i].name + " is sold for $" + filteredProducts[i].highestbid +"."
        },null,2)
    },function(error, data) {
  if (error) {
    console.log('error', error);
  }
  if(data.Payload){
   console.log('payload',data.Payload)
  }
}); 
    lambda.invoke({
      FunctionName:'send-email',
      Payload:JSON.stringify({
      "topicName": filteredProducts[i].highestbidderid,
      "subject": "You are the buyer of the product " + filteredProducts[i].name  ,
      "emailBody": "You have been offered the merchandise," + filteredProducts[i].name + " for $" + filteredProducts[i].highestbid +"."    
        },null,2)
    },function(error, data) {
  if (error) {
    console.log('error', error);
  }
  if(data.Payload){
   console.log('payload',data.Payload)
  }
});
    // let request_response_seller = requests.post({
    //     url: publishEmailAPI,
    //     headers: {'content-type': 'application/json'},
    //     body:{
    //       "topicName": filteredProducts[i].sellerid,
    //       "subject": "Your " + filteredProducts[i].name + " Sold !!!",
    //       "emailBody": "Your " + filteredProducts[i].name + " is sold for $" + filteredProducts.highestsellingamount +"."
    //     }
    //   })
    //   console.log('request_response_seller',request_response_seller)
      
    //   let request_response_buyer =  requests.post({
    //     url: publishEmailAPI,
    //     headers: {'content-type': 'application/json'},
    //     body:{
    //   "topicName": filteredProducts[i].highestbidderid,
    //   "subject": "You are the buyer of the product " + filteredProducts[i].name  ,
    //   "emailBody": "You have been offered the merchandise," + filteredProducts[i].name + " for $" + filteredProducts.highestsellingamount +"."    
    //     }
    //   })
    
    console.log('request_response_buyer',request_response_buyer)
  }
  
  const body = {
    filteredProducts: filteredProducts
  }
  return buildResponse(200, filteredProducts);
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

async function markProductSold(productId, timewhensold) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'productId': productId
        },
        UpdateExpression: `set sold = :sold, timewhensold =:timewhensold`,

        ExpressionAttributeValues: {
            ':timewhensold': timewhensold,
            ':sold': true,
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


function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PATCH"
    },
    body: JSON.stringify(body),
    "isBase64Encoded": false
  }
}