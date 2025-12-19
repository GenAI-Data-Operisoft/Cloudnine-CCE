import json
import os
import boto3
import re
from botocore.exceptions import ClientError
from datetime import datetime
from bedrock_prompt import get_extraction_prompt

REGION = os.environ.get("REGION", "ap-south-1")
TABLE_NAME = os.environ.get("SESSION_TABLE", "cce_sessions")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "cloudnine-cce")

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.client("dynamodb", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)


def lambda_handler(event, context):
    print("Event:", json.dumps(event))
    
    try:
        detail = event["detail"]
        job_name = detail["TranscriptionJobName"]
        status = detail["TranscriptionJobStatus"]
        
        print(f"Processing transcription job: {job_name}, Status: {status}")
        
        if status != "COMPLETED":
            print(f"Job status is {status}, skipping processing")
            
            # Update status to FAILED if transcription failed
            if status == "FAILED":
                dynamodb.update_item(
                    TableName=TABLE_NAME,
                    Key={"session_id": {"S": job_name}},
                    UpdateExpression="SET #status = :status, updated_at = :updated_at",
                    ExpressionAttributeNames={
                        "#status": "status"
                    },
                    ExpressionAttributeValues={
                        ":status": {"S": "TRANSCRIPTION_FAILED"},
                        ":updated_at": {"N": str(int(datetime.now().timestamp()))}
                    }
                )
            
            return {
                "statusCode": 200,
                "body": json.dumps({"message": f"Job status: {status}"})
            }
        
        # Get transcription result from S3
        # AWS Transcribe outputs to: {OutputKey}/{job_name}.json
        key = f"sessions/{job_name}/output/{job_name}.json"
        
        print(f"Fetching transcription from s3://{BUCKET_NAME}/{key}")
        
        try:
            s3_response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            transcription_data = json.loads(s3_response["Body"].read().decode("utf-8"))
            transcript = transcription_data["results"]["transcripts"][0]["transcript"]
            
            print(f"Transcript length: {len(transcript)} characters")
            print(f"Transcript preview: {transcript[:200]}...")
            
        except s3.exceptions.NoSuchKey:
            print(f"Transcription file not found at {key}")
            raise Exception(f"Transcription output file not found: {key}")
        
        # Extract patient information using Bedrock
        extracted_info = extract_patient_info(transcript)
        
        print("Extracted info:", json.dumps(extracted_info, indent=2))
        
        # Update DynamoDB with results
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={"session_id": {"S": job_name}},
            UpdateExpression="SET #status = :status, extracted_info = :info, updated_at = :updated_at",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": {"S": "COMPLETED"},
                # ":transcript": {"S": transcript},
                ":info": {"S": json.dumps(extracted_info)},
                ":updated_at": {"N": str(int(datetime.now().timestamp()))}
            }
        )
        
        print("DynamoDB updated successfully")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Transcription processed successfully",
                "sessionId": job_name,
                "transcriptLength": len(transcript),
                "extractedInfo": json.dumps(extracted_info)
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Try to update DynamoDB with error status
        try:
            job_name = event["detail"]["TranscriptionJobName"]
            dynamodb.update_item(
                TableName=TABLE_NAME,
                Key={"session_id": {"S": job_name}},
                UpdateExpression="SET #status = :status, error_message = :error, updated_at = :updated_at",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":status": {"S": "PROCESSING_FAILED"},
                    ":error": {"S": str(e)},
                    ":updated_at": {"N": str(int(datetime.now().timestamp()))}
                }
            )
        except Exception as update_error:
            print(f"Failed to update error status: {update_error}")
        
        raise e


def extract_patient_info(transcript):
    """Extract patient information from transcript using Amazon Bedrock"""
    
    try:
        # Get prompt from separate file
        prompt = get_extraction_prompt(transcript)
        
        # Use Claude Haiku for extraction
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        
        # Claude API format (Messages API)
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "temperature": 0.3,
            "top_p": 0.9,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        print("Calling Bedrock with model:", model_id)
        
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response["body"].read().decode("utf-8"))
        
        print("Bedrock response structure:", json.dumps({
            k: type(v).__name__ for k, v in response_body.items()
        }))
        
        # Extract JSON from Claude response
        # Claude response format: { "content": [{"type": "text", "text": "..."}], ... }
        content = response_body["content"][0]["text"]
        
        print(f"Bedrock content preview: {content[:500]}...")
        
        # Try to extract JSON from response (remove markdown code blocks if present)
        content_cleaned = re.sub(r'```json\s*|\s*```', '', content).strip()
        
        # Try to find JSON object
        json_match = re.search(r'\{[\s\S]*\}', content_cleaned)
        
        if json_match:
            extracted = json.loads(json_match.group(0))
            print("Successfully extracted JSON from Bedrock response")
            return extracted
        else:
            print("No JSON found in Bedrock response")
            return {
                "error": "No JSON found in response",
                "raw_content": content[:500]
            }
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return {
            "error": "Invalid JSON in response",
            "message": str(e)
        }
    except Exception as e:
        print(f"Error calling Bedrock: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": "Failed to extract information",
            "message": str(e)
        }