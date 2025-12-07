"""
Gemini AI Service for RWA Verification
Uses Google Gemini 1.5 Flash for AI-powered asset verification
"""

import json
import hashlib
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import google.generativeai as genai
from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import AssetType, VerificationStatus

logger = get_logger(__name__)


class GeminiAIError(Exception):
    """Custom exception for Gemini AI errors"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class GeminiAIService:
    """
    AI Verification Service using Google Gemini 1.5 Flash
    Analyzes RWA data for authenticity and generates verification proofs
    """
    
    # Verification prompts for different asset types
    VERIFICATION_PROMPTS = {
        AssetType.CARBON_CREDIT: """
You are an expert carbon credit verification AI oracle. Analyze the following carbon credit data and provide a comprehensive verification report.

DATA TO ANALYZE:
{data}

VERIFICATION CRITERIA:
1. Data Authenticity: Are the sensor readings consistent and within expected ranges?
2. Location Verification: Does the geolocation data match known carbon capture zones?
3. Temporal Consistency: Are timestamps logical and sequential?
4. Emission Calculations: Are carbon capture calculations mathematically sound?
5. Compliance: Does this meet international carbon credit standards (VCS, Gold Standard)?

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "verified": true/false,
    "confidence": 0.0-1.0,
    "summary": "Brief summary of verification results",
    "scores": {{
        "data_authenticity": 0.0-1.0,
        "location_verification": 0.0-1.0,
        "temporal_consistency": 0.0-1.0,
        "calculation_accuracy": 0.0-1.0,
        "compliance_score": 0.0-1.0
    }},
    "issues": ["List of any issues found"],
    "recommendations": ["List of recommendations"]
}}
""",
        
        AssetType.REAL_ESTATE: """
You are an expert real estate verification AI oracle. Analyze the following property data and provide a comprehensive verification report.

DATA TO ANALYZE:
{data}

VERIFICATION CRITERIA:
1. Document Authenticity: Are property documents consistent and properly formatted?
2. Location Verification: Does the address and coordinates match property records?
3. Valuation Analysis: Is the property valuation reasonable for the market?
4. Legal Compliance: Are there any red flags in ownership or title records?
5. Physical Condition: Based on imagery/descriptions, what is the property condition?

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "verified": true/false,
    "confidence": 0.0-1.0,
    "summary": "Brief summary of verification results",
    "scores": {{
        "document_authenticity": 0.0-1.0,
        "location_verification": 0.0-1.0,
        "valuation_accuracy": 0.0-1.0,
        "legal_compliance": 0.0-1.0,
        "condition_assessment": 0.0-1.0
    }},
    "issues": ["List of any issues found"],
    "recommendations": ["List of recommendations"]
}}
""",
        
        AssetType.TREASURY: """
You are an expert treasury/bond verification AI oracle. Analyze the following treasury instrument data and provide a comprehensive verification report.

DATA TO ANALYZE:
{data}

VERIFICATION CRITERIA:
1. Instrument Authenticity: Does this match official treasury records?
2. CUSIP/ISIN Validation: Are the identifiers valid and properly formatted?
3. Yield Consistency: Are yields consistent with current market rates?
4. Maturity Analysis: Is the maturity date and structure valid?
5. Issuer Verification: Is the issuing authority legitimate?

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "verified": true/false,
    "confidence": 0.0-1.0,
    "summary": "Brief summary of verification results",
    "scores": {{
        "instrument_authenticity": 0.0-1.0,
        "identifier_validation": 0.0-1.0,
        "yield_consistency": 0.0-1.0,
        "maturity_validity": 0.0-1.0,
        "issuer_verification": 0.0-1.0
    }},
    "issues": ["List of any issues found"],
    "recommendations": ["List of recommendations"]
}}
""",
        
        "default": """
You are an expert asset verification AI oracle. Analyze the following real-world asset data and provide a comprehensive verification report.

DATA TO ANALYZE:
{data}

VERIFICATION CRITERIA:
1. Data Authenticity: Is the data consistent and from reliable sources?
2. Documentation: Are supporting documents valid and properly formatted?
3. Valuation: Is the asset valuation reasonable?
4. Legal Compliance: Are there any compliance concerns?
5. Risk Assessment: What is the overall risk profile?

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "verified": true/false,
    "confidence": 0.0-1.0,
    "summary": "Brief summary of verification results",
    "scores": {{
        "data_authenticity": 0.0-1.0,
        "documentation_quality": 0.0-1.0,
        "valuation_reasonability": 0.0-1.0,
        "legal_compliance": 0.0-1.0,
        "risk_profile": 0.0-1.0
    }},
    "issues": ["List of any issues found"],
    "recommendations": ["List of recommendations"]
}}
"""
    }
    
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=settings.gemini_api_key)
        
        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config={
                "temperature": 0.1,  # Low temperature for consistent outputs
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
                "response_mime_type": "application/json",
            }
        )
        
        logger.info(f"Gemini AI Service initialized with model: {settings.gemini_model}")
    
    def _get_prompt(self, asset_type: AssetType) -> str:
        """Get verification prompt for asset type"""
        return self.VERIFICATION_PROMPTS.get(
            asset_type,
            self.VERIFICATION_PROMPTS["default"]
        )
    
    def _generate_data_hash(self, data: Dict[str, Any]) -> str:
        """Generate SHA256 hash of input data"""
        data_string = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    async def verify_asset(
        self,
        asset_type: AssetType,
        data: Dict[str, Any],
        additional_context: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], str]:
        """
        Verify an RWA asset using Gemini AI.
        
        Args:
            asset_type: Type of asset to verify
            data: Asset data to analyze
            additional_context: Optional additional context for verification
        
        Returns:
            Tuple of (verification_result, input_hash)
        """
        start_time = datetime.utcnow()
        input_hash = self._generate_data_hash(data)
        
        try:
            # Build prompt
            prompt_template = self._get_prompt(asset_type)
            
            # Format data for the prompt
            data_string = json.dumps(data, indent=2, default=str)
            if additional_context:
                data_string += f"\n\nADDITIONAL CONTEXT:\n{additional_context}"
            
            prompt = prompt_template.format(data=data_string)
            
            logger.info(f"Starting AI verification for {asset_type.value}, input_hash: {input_hash}")
            
            # Call Gemini
            response = await self.model.generate_content_async(prompt)
            
            # Parse response
            try:
                result = json.loads(response.text)
            except json.JSONDecodeError:
                # Try to extract JSON from response
                text = response.text
                start_idx = text.find('{')
                end_idx = text.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    result = json.loads(text[start_idx:end_idx])
                else:
                    raise GeminiAIError("Invalid JSON response from AI", {"response": text})
            
            # Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Enrich result
            result["processing_time_ms"] = processing_time_ms
            result["input_hash"] = input_hash
            result["model"] = settings.gemini_model
            result["timestamp"] = datetime.utcnow().isoformat()
            
            logger.info(
                f"AI verification complete. Verified: {result.get('verified')}, "
                f"Confidence: {result.get('confidence')}, Time: {processing_time_ms}ms"
            )
            
            return result, input_hash
            
        except Exception as e:
            logger.error(f"AI verification failed: {str(e)}")
            raise GeminiAIError(f"Verification failed: {str(e)}")
    
    async def analyze_document(
        self,
        document_content: str,
        document_type: str,
    ) -> Dict[str, Any]:
        """
        Analyze a document for authenticity and extract key information.
        
        Args:
            document_content: Text content of the document
            document_type: Type of document (deed, certificate, contract, etc.)
        
        Returns:
            Analysis result dictionary
        """
        prompt = f"""
You are an expert document analysis AI. Analyze the following {document_type} and extract key information.

DOCUMENT CONTENT:
{document_content}

ANALYZE AND PROVIDE:
1. Document authenticity indicators
2. Key extracted information (dates, parties, values, etc.)
3. Any red flags or inconsistencies
4. Confidence in document authenticity

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "authentic": true/false,
    "confidence": 0.0-1.0,
    "document_type": "detected type",
    "extracted_info": {{
        "key": "value pairs of extracted data"
    }},
    "red_flags": ["list of concerns"],
    "authenticity_indicators": ["positive indicators"]
}}
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Document analysis failed: {str(e)}")
            raise GeminiAIError(f"Document analysis failed: {str(e)}")
    
    async def generate_verification_summary(
        self,
        verification_results: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate an overall verification summary from multiple verification results.
        
        Args:
            verification_results: List of individual verification results
        
        Returns:
            Combined summary with overall assessment
        """
        prompt = f"""
You are an expert RWA verification summarizer. Combine the following verification results into an overall assessment.

VERIFICATION RESULTS:
{json.dumps(verification_results, indent=2)}

PROVIDE AN OVERALL SUMMARY:
1. Overall verification status
2. Combined confidence score
3. Key findings across all verifications
4. Critical issues requiring attention
5. Final recommendation

RESPOND WITH EXACTLY THIS JSON FORMAT:
{{
    "overall_verified": true/false,
    "overall_confidence": 0.0-1.0,
    "key_findings": ["list of important findings"],
    "critical_issues": ["list of critical issues"],
    "recommendation": "final recommendation text",
    "verification_count": number,
    "passed_count": number
}}
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Summary generation failed: {str(e)}")
            raise GeminiAIError(f"Summary generation failed: {str(e)}")


# Service instance factory
def get_gemini_service() -> GeminiAIService:
    """Get Gemini AI service instance"""
    return GeminiAIService()
