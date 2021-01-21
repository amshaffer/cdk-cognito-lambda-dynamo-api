import os
import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.getenv('TABLE_NAME')
CALCULATOR_LAMBDA = os.getenv('CALCULATOR_LAMBDA')

def handler(event, context):
    
    print(event)
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)
    user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]
    thing_id = str(uuid.uuid4())
    try:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(TABLE_NAME)
        body = json.loads(event.get("body"))
        thing_name = body.get("thingName")
        thing_type = body.get("thingType")
        thing = {
            "partitionKey": user_id,
            "sortKey": "thing_{}".format(thing_id),
            "thingId": thing_id,
            "userId": user_id,
            "thingName": thing_name,
            "thingType": thing_type,
        }
        put_item_response = table.put_item(Item=thing)

        aws_lambda = boto3.client("lambda")
        lambda_invoke_response = aws_lambda.invoke(
            FunctionName=CALCULATOR_LAMBDA,
            InvocationType='Event',
            Payload=json.dumps({"thingId": thing_id, "userId": user_id})
        )

        print(lambda_invoke_response)
        return {"thingId": thing_id}
    except Exception as e:
        print(e)
        return {"message": "error!"}