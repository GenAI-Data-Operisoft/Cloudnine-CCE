import json
import boto3
import os
import time
import shortuuid

REGION = os.environ["REGION"]
BUCKET_NAME = os.environ["BUCKET_NAME"]
SESSION_TABLE = os.environ["SESSION_TABLE"]

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(SESSION_TABLE)

SUPPORTED_AUDIO_FORMATS = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4"
}

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        patient_id = body.get("patient_id")
        patient_name = body.get("patient_name")
        cce_id = body.get("cce_id")
        filename = body.get("filename")
        language_preferences = body.get("language_preferences", ["en-IN"])

        if not all([patient_id, cce_id, filename]):
            return response(400, {
                "error": "patient_id, cce_id, and filename are required"
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
                "Key": input_path,
                "ContentType": content_type
            },
            ExpiresIn=3600,
            HttpMethod="PUT"
        )

        table.put_item(
            Item={
                "session_id": session_id,
                "patient_id": patient_id,
                "patient_name": patient_name,
                "cce_id": cce_id,
                "language_preferences": language_preferences,
                "status": "UPLOAD_URL_GENERATED",
                "content_type": content_type,
                "s3_input_path": input_path,
                "s3_output_path": output_path,
                "created_at": int(time.time())
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
