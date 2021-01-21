import os
import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.getenv('TABLE_NAME')

def handler(event, context):
    
    print(event)
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)
    user_id = event.get("userId")
    thing_id = event.get("thingId")
    try:
        import random
        from time import sleep
        sleep(15)
        results = str(random.random())
        table.update_item(
            Key={
                "partitionKey": user_id,
                "sortKey": "thing_{}".format(thing_id),
            },
            UpdateExpression="set results = :results",
            ExpressionAttributeValues={
                ":results": results
            }
        )
        return {"thingId": thing_id}
    except Exception as e:
        print(e)
        return {"message": "error!"}