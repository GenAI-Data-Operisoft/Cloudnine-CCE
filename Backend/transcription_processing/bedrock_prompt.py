"""
Bedrock prompt template for extracting patient information from transcripts
"""

def get_extraction_prompt(transcript):
    """
    Generate the prompt for extracting patient information from a transcript.
    
    Args:
        transcript (str): The conversation transcript to analyze
        
    Returns:
        str: The formatted prompt for Bedrock
    """
    return f"""You are an AI assistant helping to extract patient information from a Cloud9 Hospital customer care conversation transcript.

The conversation may be in English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, or a mix of these languages.

Extract the following information from the conversation:

PREGNANCY RELATED:
- Customer's EDD (Expected Delivery Date)
- Is this customer's first pregnancy? (Yes/No)
- What scans are done already? (EP Scan, NT Scan, Anomaly Scan, Growth 1, Growth 2, Other)
- Is the customer having twins? (Yes/No/More than 2)

IMPORTANT - Scan Progression Logic:
When the patient/customer mentions scans in response to "What scans are done already?", understand the scan sequence:
1. EP Scan (First scan)
2. NT Scan (Second scan)
3. Anomaly Scan (Third scan)
4. Growth 1 (Fourth scan)
5. Growth 2 (Fifth scan)

Interpretation Rules:
- If patient mentions "Growth 2" → They have completed ALL scans: ["EP Scan", "NT Scan", "Anomaly Scan", "Growth 1", "Growth 2"]
- If patient mentions "Growth 1" → They have completed: ["EP Scan", "NT Scan", "Anomaly Scan", "Growth 1"]
- If patient mentions "Anomaly Scan" → They have completed: ["EP Scan", "NT Scan", "Anomaly Scan"]
- If patient mentions "NT Scan" → They have completed: ["EP Scan", "NT Scan"]
- If patient mentions "EP Scan" → They have completed: ["EP Scan"]

FAMILY & PERSONAL:
- Where is the customer from? (Location/City)
- Any relatives living with the customer? (No, Parents/In-laws, Siblings, Others)
- What does the expecting mother do for work? (Salaried, Business, Housemate, Other)
- What does the expecting father do for work? (Salaried, Business, Housemate, Other)

CLOUDNINE AWARENESS:
- How did you learn about Cloudnine? (Family/Relatives, Friends/Colleagues, Online search, Past customer, Social media, Physical presence, Doctor recommendation)
- Is the customer aware of Cloudnine's birthing packages? (Yes/No)
- Has customer downloaded the app? (Yes/No)
- How does customer book appointments? (Walk-in, App, Call centre, Call to CCE, Practo, Chatbot)

INSURANCE:
- Does customer have insurance? (Single insurance, Dual insurance, No)

CCE OBSERVATIONS:
- How did customer come to hospital? (Own vehicle, Own vehicle with driver, Cab, Auto, Bus, Walking)
- Has customer mentioned competitors (Motherhood, Rainbow, etc)? (Yes/No)
- Did customer seem interested/excited about Cloudnine facilities? (Yes/No)
- Did customer ask for specific doctor or fine with anyone? (Specific doctor/Fine with anyone)
- Did customer inquire about lowering price or discounts? (Yes/No)
- Who else is customer accompanied by? (Parents, Siblings, Friends, No one)
- Does customer bring other children during visits? (No other children, No, Yes)
- Did doctor remark about customer asking lots of questions? (Yes/No)
- Has customer mentioned going to native place to deliver? (Yes/No)

Transcript:
{transcript}

Return ONLY a valid JSON object with the extracted information. Use null for fields not found. Use "unknown" for unclear answers.

Format:
{{
  "pregnancy_related": {{
    "customer_edd": "YYYY-MM-DD or null",
    "first_pregnancy": true | false | null,
    "scans_done": ["EP Scan", "NT Scan", "Anomaly Scan", "Growth 1", "Growth 2", "Other"] or [],
    "having_twins": "yes" | "no" | "more_than_2" | "unknown"
  }},
  "family_personal": {{
    "customer_location": "string or null",
    "relatives_living_with": "no" | "parents_in_laws" | "siblings" | "others" | "unknown",
    "mother_occupation": "salaried" | "business" | "housemate" | "other" | "unknown",
    "father_occupation": "salaried" | "business" | "housemate" | "other" | "unknown"
  }},
  "cloudnine_awareness": {{
    "how_learned_cloudnine": "family_relatives" | "friends_colleagues" | "online_search" | "past_customer_fertility" | "past_customer_gynecology" | "past_customer_maternity" | "social_media" | "physical_presence" | "doctor_recommendation" | "unknown",
    "aware_of_packages": true | false | null,
    "downloaded_app": true | false | null,
    "booking_method": "walk_in" | "app" | "call_centre" | "call_to_cce" | "practo" | "chatbot" | "unknown"
  }},
  "insurance": {{
    "insurance_status": "single_insurance" | "dual_insurance" | "no" | "unknown"
  }},
  "cce_observations": {{
    "transport_method": "own_vehicle" | "own_vehicle_with_driver" | "cab" | "auto" | "bus" | "walking" | "unknown",
    "mentioned_competitors": true | false | null,
    "interested_in_facilities": true | false | null,
    "doctor_preference": "specific_doctor" | "fine_with_anyone" | "unknown",
    "doctor_name": "string or null",
    "price_inquiry": true | false | null,
    "accompanied_by": "parents" | "siblings" | "friends" | "no_one" | "unknown",
    "brings_other_children": "no_other_children" | "no" | "yes" | "unknown",
    "doctor_remark_questions": true | false | null,
    "going_to_native": true | false | null
  }},
  "additional_insights": {{
    "conversation_summary": "2-3 sentence summary",
    "key_concerns": ["list of concerns"],
    "positive_signals": ["list of positive signals"],
    "package_interest": "luxury" | "signature" | "apartment" | "presidential" | "none" | "unknown"
  }}
}}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown code blocks
2. Use null for unknown/not mentioned fields
3. Extract information from all languages in the conversation
4. Be conservative - if not sure, use "unknown" or null
5. For dates, use YYYY-MM-DD format
6. For boolean fields, use true/false/null
7. Extract doctor name if mentioned specifically
8. Apply the scan progression logic strictly - infer all completed scans based on the latest scan mentioned"""