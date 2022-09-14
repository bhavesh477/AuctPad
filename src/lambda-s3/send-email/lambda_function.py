import boto3
import json
from botocore.exceptions import ClientError
import logging

sns = boto3.resource('sns')

def lambda_handler(event, context):
    try:
        topicName = event['topicName']
        subject = event['subject']
        emailBody = event['emailBody']

        topic = sns.create_topic(Name=topicName)
        topic.publish(
            Message=emailBody,
            Subject=subject
        )
        return {
            'statusCode': 200,
            'body': {
                'success': True,
                'message': 'Mail sent succcessfully.'
            }
        }
    except ClientError as ce:
        logger.exception("Couldn't create topic %s.", name)
        return {
            'statusCode': 400,
            'error': {
                'success': False,
                'message': 'Email trigger failed'
            },
            'errorMessage': ce.message
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