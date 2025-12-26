#audio_upload/app.py
import json
import boto3
import os
from datetime import datetime
import pytz
import shortuuid

REGION = os.environ["REGION"]
BUCKET_NAME = os.environ["BUCKET_NAME"]
SESSION_TABLE = os.environ["SESSION_TABLE"]

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(SESSION_TABLE)

SUPPORTED_AUDIO_FORMATS = {
    ".flac": "audio/flac",     # Recommended (lossless)
    ".mp3": "audio/mpeg",
    ".mp4": "audio/mp4",       # Audio track only
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",       # Recommended (lossless)
    ".ogg": "audio/ogg",       # Opus codec
    ".webm": "audio/webm"      # Opus codec
}

def get_indian_datetime():
    """Returns current datetime in Indian timezone formatted as DD/MM/YYYY HH:MM:SS"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist).strftime("%d/%m/%Y %H:%M:%S")

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        patient_name = body.get("patient_name")
        filename = body.get("filename")
        language_preferences = body.get("language_preferences", ["en-IN"])
        
        if not all([patient_name, filename]):
            return response(400, {
                "error": "patient_name and filename are required"
            })
        
        filename = os.path.basename(filename).lower()
        extension = next(
            (ext for ext in SUPPORTED_AUDIO_FORMATS if filename.endswith(ext)),
            None
        )
        
        if not extension:
            return response(400, {
                "error": f"Unsupported format. Supported: {list(SUPPORTED_AUDIO_FORMATS.keys())}"
            })
        
        content_type = SUPPORTED_AUDIO_FORMATS[extension]
        session_id = f"session-{shortuuid.ShortUUID().random(length=8)}"
        session_folder = f"sessions/{session_id}"
        input_path = f"{session_folder}/input/audio{extension}"
        output_path = f"{session_folder}/output/{session_id}.json"
        
        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": input_path
            },
            ExpiresIn=3600,
            HttpMethod="PUT"
        )
        
        created_datetime = get_indian_datetime()
        
        table.put_item(
            Item={
                "session_id": session_id,
                "patient_name": patient_name,
                "language_preferences": language_preferences,
                "status": "UPLOAD_URL_GENERATED",
                "content_type": content_type,
                "s3_input_path": input_path,
                "s3_output_path": output_path,
                "created_at": created_datetime,
                "updated_at": created_datetime
            }
        )
        
        return response(200, {
            "session_id": session_id,
            "presigned_url": presigned_url,
            "expires_in": 3600,
            "status": "UPLOAD_URL_GENERATED",
            "s3_input_path": input_path,
            "s3_output_path": output_path
        })
    
    except Exception as e:
        print("Error:", e)
        return response(500, {"error": "Internal server error"})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        },
        "body": json.dumps(body)
    }