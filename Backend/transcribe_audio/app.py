# transcribe_audio/app.py
import json
import os
import boto3
from urllib.parse import unquote_plus
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION", "ap-south-1")
TABLE_NAME = os.environ.get("SESSION_TABLE", "cce_sessions")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "cloudnine-cce")

dynamodb = boto3.client("dynamodb", region_name=REGION)
transcribe = boto3.client("transcribe", region_name=REGION)


def lambda_handler(event, context):
    print("Event:", json.dumps(event))
    
    try:
        # Get S3 event details
        record = event["Records"][0]
        bucket = record["s3"]["bucket"]["name"]
        key = unquote_plus(record["s3"]["object"]["key"])
        
        print(f"Processing file: s3://{bucket}/{key}")
        
        # Extract session ID from path
        # Format: sessions/session-{id}/input/audio.mp3
        path_parts = key.split("/")
        session_id = path_parts[1]  # sessions/[session-id]/input/audio.mp3
        
        print(f"Session ID: {session_id}")
        
        # Get session from DynamoDB to retrieve language preferences
        try:
            session_response = dynamodb.get_item(
                TableName=TABLE_NAME,
                Key={"session_id": {"S": session_id}}
            )
            
            if "Item" not in session_response:
                print("Session not found in DynamoDB, using default language")
                language_preferences = ["en-IN"]
            else:
                # Extract language preferences from DynamoDB list format
                lang_prefs_raw = session_response["Item"].get("language_preferences", {})
                if "L" in lang_prefs_raw:
                    language_preferences = [lang["S"] for lang in lang_prefs_raw["L"]]
                else:
                    language_preferences = ["en-IN"]
                    
        except ClientError as e:
            print(f"DynamoDB error: {e}")
            language_preferences = ["en-IN"]
        
        print(f"Language preferences: {language_preferences}")
        
        # Start Transcribe job
        output_key = f"sessions/{session_id}/output/"
        
        transcribe_params = {
            "TranscriptionJobName": session_id,
            "Media": {"MediaFileUri": f"s3://{bucket}/{key}"},
            "OutputBucketName": bucket,
            "OutputKey": output_key,
            "Settings": {
                "ShowSpeakerLabels": True,
                "MaxSpeakerLabels": 2
            }
        }
        
        # Handle multi-language scenarios (code-switching support)
        if len(language_preferences) > 1:
            # Use IdentifyMultipleLanguages for multi-language in same audio
            transcribe_params["IdentifyMultipleLanguages"] = True
            transcribe_params["LanguageOptions"] = language_preferences
            print(f"Multi-language mode enabled with languages: {language_preferences}")
        else:
            # Single language mode
            transcribe_params["LanguageCode"] = language_preferences[0]
            print(f"Single language mode: {language_preferences[0]}")
        
        print("Starting transcription job:", json.dumps(transcribe_params))
        
        transcribe_response = transcribe.start_transcription_job(**transcribe_params)
        
        job_name = transcribe_response["TranscriptionJob"]["TranscriptionJobName"]
        print(f"Transcription job started: {job_name}")
        
        # Update DynamoDB with transcription status
        from datetime import datetime
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={"session_id": {"S": session_id}},
            UpdateExpression="SET #status = :status, transcription_job_name = :job_name, updated_at = :updated_at",
            ExpressionAttributeNames={
                "#status": "status"  # 'status' is a reserved word in DynamoDB
            },
            ExpressionAttributeValues={
                ":status": {"S": "TRANSCRIPTION_IN_PROGRESS"},
                ":job_name": {"S": session_id},
                ":updated_at": {"N": str(int(datetime.now().timestamp()))}
            }
        )
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Transcription job started successfully",
                "sessionId": session_id,
                "jobName": session_id,
                "languageMode": "multi-language" if len(language_preferences) > 1 else "single-language",
                "languages": language_preferences
            })
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise e