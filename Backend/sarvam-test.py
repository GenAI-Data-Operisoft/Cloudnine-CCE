import boto3
import json
import base64

def test_sarvam_endpoint(audio_file_path, endpoint_name="sarvam-ai-shukass", region="ap-south-1"):
    """
    Test Sarvam audio transcription endpoint on SageMaker
    
    Args:
        audio_file_path: Path to your WAV audio file
        endpoint_name: SageMaker endpoint name
        region: AWS region
    """
    
    # Initialize SageMaker runtime client
    sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
    
    try:
        # Read and encode audio file
        print(f"Reading audio file: {audio_file_path}")
        with open(audio_file_path, 'rb') as f:
            audio_bytes = f.read()
        
        # Base64 encode the audio
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"Audio file size: {len(audio_bytes)} bytes")
        
        # Prepare the payload
        payload = {
            "audio": audio_base64,
            "max_new_tokens": 256
        }
        
        # Convert to JSON
        payload_json = json.dumps(payload)
        
        print(f"\nInvoking endpoint: {endpoint_name}")
        print("Please wait, processing audio...")
        
        # Invoke the endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=payload_json
        )
        
        # Parse the response
        result = json.loads(response['Body'].read().decode('utf-8'))
        
        print("\n" + "="*60)
        print("TRANSCRIPTION RESULT")
        print("="*60)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*60)
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        
        # Provide helpful debugging info
        if "Could not find endpoint" in str(e):
            print("\n💡 Tip: Check if your endpoint name is correct and deployed")
        elif "ValidationException" in str(e):
            print("\n💡 Tip: Check your payload format")
        
        raise

if __name__ == "__main__":
    # Replace with your audio file path
    AUDIO_FILE = "/home/ubuntu/Cloudnine-CCE/Backend/Cloudnine-CCE/Sarvam_test.wav"
    
    try:
        result = test_sarvam_endpoint(AUDIO_FILE)
        
        # Extract specific fields if available
        if isinstance(result, list) and len(result) > 0:
            output = result[0].get('generated_text', '')
            print(f"\n📝 Generated Text:\n{output}")
            
    except FileNotFoundError:
        print(f"\n❌ Audio file not found: {AUDIO_FILE}")
        print("Please update the AUDIO_FILE variable with the correct path")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")