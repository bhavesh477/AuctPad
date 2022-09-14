import boto3
import json
from botocore.exceptions import ClientError
import logging

sns = boto3.resource('sns')

def lambda_handler(event, context):
    try:
        topicName = event['topicName']
        userEmail = event['userEmail']
        topics = sns.topics.all()
        for topic in topics:
            if topic.attributes['TopicArn'].rsplit(':',1)[1] == topicName:
                return {
                    'statusCode': 409,
                    'body': {
                        'success': False,
                        'message': 'Topic creation failed. Topic already exist.'
                    }
                }
        topic = sns.create_topic(Name=topicName)
        topic.subscribe(Protocol='email', Endpoint=userEmail, ReturnSubscriptionArn=True)
        
        return {
            'statusCode': 200,
            'body': {
                'success': True,
                'message': 'Topic created succcessfully.'
            }
        }
    except Exception as ee:
        print(ee)
        return {
            'statusCode': 500,
            'error': {
                'message': ee.message
            },
            'error': ee
        }