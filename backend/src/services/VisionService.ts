import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
}

interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ExtractedData {
  [key: string]: any;
}

interface DocumentQuality {
  isBlurry: boolean;
  isLowResolution: boolean;
  hasGoodContrast: boolean;
  overallQuality: 'good' | 'acceptable' | 'poor';
  qualityScore: number;
}

class VisionService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key') {
      logger.warn('Google API key not configured. Vision AI features will be limited.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  /**
   * Perform OCR on a document image using Gemini Vision
   */
  async performOCR(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const prompt = `Extract all text from this document image. 
      Return the text exactly as it appears, preserving formatting and structure.
      Also provide a confidence score (0-1) for the extraction quality.`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt
      ]);

      const response = result.response;
      const text = response.text();

      // Estimate confidence based on response quality
      const confidence = this.estimateConfidence(text);

      return {
        text,
        confidence,
        blocks: [{ text, confidence }]
      };
    } catch (error) {
      logger.error('Error performing OCR:', error);
      throw new Error('Failed to perform OCR on document');
    }
  }

  /**
   * Extract structured data from document based on type
   */
  async extractFields(
    imageBuffer: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<{ data: ExtractedData; confidence: number }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const base64Image = imageBuffer.toString('base64');

      // Get extraction prompt based on document type
      const prompt = this.getExtractionPrompt(documentType);

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt
      ]);

      const response = result.response;
      const text = response.text();

      // Parse the structured response
      const extractedData = this.parseExtractedData(text, documentType);
      const confidence = this.estimateConfidence(text);

      return {
        data: extractedData,
        confidence
      };
    } catch (error) {
      logger.error('Error extracting fields:', error);
      throw new Error('Failed to extract fields from document');
    }
  }

  /**
   * Assess document quality
   */
  async assessQuality(imageBuffer: Buffer, mimeType: string): Promise<DocumentQuality> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const base64Image = imageBuffer.toString('base64');

      const prompt = `Analyze this document image and assess its quality.
      Check for:
      1. Blur or focus issues
      2. Resolution quality
      3. Contrast and readability
      4. Overall suitability for text extraction
      
      Respond in JSON format with:
      {
        "isBlurry": boolean,
        "isLowResolution": boolean,
        "hasGoodContrast": boolean,
        "qualityScore": number (0-100),
        "issues": string[]
      }`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt
      ]);

      const response = result.response;
      const text = response.text();

      // Parse quality assessment
      const quality = this.parseQualityAssessment(text);

      return quality;
    } catch (error) {
      logger.error('Error assessing document quality:', error);
      // Return default quality assessment
      return {
        isBlurry: false,
        isLowResolution: false,
        hasGoodContrast: true,
        overallQuality: 'acceptable',
        qualityScore: 70
      };
    }
  }

  /**
   * Get extraction prompt based on document type
   */
  private getExtractionPrompt(documentType: string): string {
    const prompts: Record<string, string> = {
      marksheet_10th: `Extract the following information from this Class 10 marksheet:
        - Student Name
        - Roll Number
        - School Name
        - Board Name (CBSE, ICSE, State Board, etc.)
        - Year of Passing
        - Total Marks
        - Percentage/CGPA
        - Subject-wise marks
        
        Return the data in JSON format.`,

      marksheet_12th: `Extract the following information from this Class 12 marksheet:
        - Student Name
        - Roll Number
        - School Name
        - Board Name (CBSE, ICSE, State Board, etc.)
        - Year of Passing
        - Stream (Science, Commerce, Arts)
        - Total Marks
        - Percentage/CGPA
        - Subject-wise marks
        
        Return the data in JSON format.`,

      id_proof: `Extract the following information from this ID document:
        - Document Type (Aadhar, PAN, Passport, etc.)
        - ID Number
        - Name
        - Date of Birth
        - Address (if present)
        - Issue Date (if present)
        - Expiry Date (if present)
        
        Return the data in JSON format.`,

      photo: `Analyze this passport photo and check:
        - Is it a clear face photo?
        - Is the background appropriate (white/light colored)?
        - Is the face clearly visible?
        - Are there any quality issues?
        
        Return the assessment in JSON format.`,

      fee_receipt: `Extract the following information from this fee receipt:
        - Receipt Number
        - Transaction ID
        - Amount Paid
        - Payment Date
        - Payment Method
        - Student Name (if present)
        - Fee Type/Description
        
        Return the data in JSON format.`,

      medical_certificate: `Extract the following information from this medical certificate:
        - Patient Name
        - Certificate Date
        - Doctor Name
        - Medical Registration Number
        - Hospital/Clinic Name
        - Fitness Status
        - Any medical conditions mentioned
        
        Return the data in JSON format.`
    };

    return prompts[documentType] || `Extract all relevant information from this document in JSON format.`;
  }

  /**
   * Parse extracted data from AI response
   */
  private parseExtractedData(text: string, documentType: string): ExtractedData {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse key-value pairs
      const data: ExtractedData = { raw_text: text };
      const lines = text.split('\n');

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            data[key] = value;
          }
        }
      }

      return data;
    } catch (error) {
      logger.warn('Failed to parse extracted data, returning raw text');
      return { raw_text: text };
    }
  }

  /**
   * Parse quality assessment from AI response
   */
  private parseQualityAssessment(text: string): DocumentQuality {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const qualityScore = parsed.qualityScore || 70;

        return {
          isBlurry: parsed.isBlurry || false,
          isLowResolution: parsed.isLowResolution || false,
          hasGoodContrast: parsed.hasGoodContrast !== false,
          overallQuality: qualityScore >= 80 ? 'good' : qualityScore >= 60 ? 'acceptable' : 'poor',
          qualityScore
        };
      }
    } catch (error) {
      logger.warn('Failed to parse quality assessment');
    }

    // Default quality
    return {
      isBlurry: false,
      isLowResolution: false,
      hasGoodContrast: true,
      overallQuality: 'acceptable',
      qualityScore: 70
    };
  }

  /**
   * Estimate confidence based on text quality
   */
  private estimateConfidence(text: string): number {
    if (!text || text.length < 10) return 0.3;

    let confidence = 0.7;

    // Check for common OCR issues
    if (text.includes('�') || text.includes('???')) {
      confidence -= 0.2;
    }

    // Check for reasonable text structure
    const hasProperCapitalization = /[A-Z]/.test(text);
    const hasNumbers = /\d/.test(text);
    const hasReasonableLength = text.length > 50;

    if (hasProperCapitalization) confidence += 0.1;
    if (hasNumbers) confidence += 0.1;
    if (hasReasonableLength) confidence += 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Validate extracted data against expected patterns
   */
  validateExtractedData(data: ExtractedData, _documentType: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Document type specific validation
    switch (_documentType) {
      case 'marksheet_10th':
      case 'marksheet_12th':
        if (!data.student_name && !data.name) {
          errors.push('Student name not found');
        }
        if (!data.roll_number && !data.rollnumber) {
          warnings.push('Roll number not found');
        }
        if (!data.percentage && !data.cgpa && !data.total_marks) {
          warnings.push('Marks/percentage not found');
        }
        break;

      case 'id_proof':
        if (!data.id_number && !data.document_number) {
          errors.push('ID number not found');
        }
        if (!data.name) {
          errors.push('Name not found');
        }
        break;

      case 'fee_receipt':
        if (!data.amount && !data.amount_paid) {
          errors.push('Payment amount not found');
        }
        if (!data.receipt_number && !data.transaction_id) {
          warnings.push('Receipt/Transaction number not found');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default new VisionService();
