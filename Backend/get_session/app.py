import json
import os
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError
from boto3.dynamodb.types import TypeDeserializer

REGION = os.environ.get("REGION", "ap-south-1")
TABLE_NAME = os.environ.get("SESSION_TABLE", "cce_sessions")

dynamodb = boto3.client("dynamodb", region_name=REGION)
deserializer = TypeDeserializer()


def deserialize_item(item):
    """
    Convert DynamoDB AttributeValue map to normal dict
    """
    return {k: deserializer.deserialize(v) for k, v in item.items()}


def decimal_to_number(obj):
    """
    Convert Decimal objects to int or float for JSON serialization
    """
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(body, default=decimal_to_number),  # Add default handler
    }


def lambda_handler(event, context):
    print("Event:", json.dumps(event))

    try:
        # Read path param
        path_params = event.get("pathParameters") or {}
        session_id = path_params.get("session_id")

        if not session_id:
            return response(400, {
                "error": "Missing session_id path parameter"
            })

        # Fetch session from DynamoDB
        result = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={
                "session_id": {"S": session_id}
            }
        )

        if "Item" not in result:
            return response(404, {
                "error": "Session not found",
                "session_id": session_id
            })

        item = deserialize_item(result["Item"])

        # Normalize output
        session = {
            "session_id": item.get("session_id"),
            "status": item.get("status"),
            "patient_id": item.get("patient_id"),
            "patient_name": item.get("patient_name"),
            "cce_id": item.get("cce_id"),
            "language_preferences": item.get("language_preferences", []),
            "content_type": item.get("content_type"),
            "s3_input_path": item.get("s3_input_path"),
            "s3_output_path": item.get("s3_output_path"),
            "transcription_job_name": item.get("transcription_job_name"),
            "transcription_output": item.get("transcription_output"),
            "extracted_data": item.get("extracted_info"),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
        }

        return response(200, session)

    except ClientError as e:
        print("DynamoDB error:", e)
        return response(500, {
            "error": "DynamoDB error",
            "message": str(e)
        })

    except Exception as e:
        print("Unhandled error:", e)
        return response(500, {
            "error": "Internal server error",
            "message": str(e)
        })