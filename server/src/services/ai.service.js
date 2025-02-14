import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { addDocumentToStore, searchSimilarDocuments, deleteAllDocuments } from './vectorStore.js';
import { LLMService } from './llm.service.js';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import mammoth from 'mammoth';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pdf from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const llm = new LLMService();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,  // Smaller chunks for faster processing
  chunkOverlap: 20, // Minimal overlap to save processing time
});

// Create temp directory if it doesn't exist
const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const getFileLoader = (filePath, fileType) => {
  switch(fileType.toLowerCase()) {
    case 'pdf':
      return {
        load: async () => {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdf(dataBuffer);
          
          // Extract and clean the text content with minimal cleaning
          let cleanText = data.text
            .replace(/<<[^>]*>>/g, '') // Remove PDF dictionary objects
            .replace(/\[\d+ \d+ R\]/g, '') // Remove PDF references
            .replace(/\/?[0-9]+ [0-9]+ obj/g, '') // Remove PDF object markers
            .replace(/endobj|endstream|startxref|xref|trailer/g, '') // Remove PDF markers
            .trim();

          // Split into paragraphs and clean each one
          const paragraphs = cleanText.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0 && p.length >= 10); // Only remove empty or very short paragraphs

          if (paragraphs.length === 0) {
            throw new Error('No readable text content found in PDF');
          }

          console.log('Extracted PDF text:', paragraphs[0].substring(0, 200) + '...');

          return [{
            pageContent: paragraphs.join('\n\n'),
            metadata: {
              pdf_numpages: data.numpages,
              pdf_info: data.info || {},
              source: filePath,
            }
          }];
        }
      };
    case 'pptx':
    case 'ppt':
      return {
        load: async () => {
          const buffer = fs.readFileSync(filePath);
          try {
            const result = await mammoth.extractRawText({ buffer });
            const text = result.value.trim();
            
            if (!text || text.length < 10) {
              throw new Error('No readable text content found in presentation');
            }

            return [{
              pageContent: text,
              metadata: {
                source: filePath,
                type: fileType
              }
            }];
          } catch (error) {
            console.error('Error processing presentation:', error);
            throw new Error(`Failed to process ${fileType.toUpperCase()} file: ${error.message}`);
          }
        }
      };
    case 'txt':
      return new TextLoader(filePath);
    case 'csv':
      return new CSVLoader(filePath);
    case 'docx':
    case 'doc':
      return new UnstructuredLoader(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

export const processDocument = async (fileUrl, fileName) => {
  let tempFilePath = null;
  
  try {
    console.log('Starting document processing:', { fileUrl, fileName, tempDir });
    
    // Clean up existing documents before processing new ones
    await deleteAllDocuments();
    console.log('Cleared existing documents from vector store');
    
    // Clean up the file name by removing URL parameters
    const cleanFileName = fileName.split('?')[0];
    
    // Get file extension and validate
    const fileType = cleanFileName.split('.').pop().toLowerCase();
    const supportedTypes = ['pdf', 'txt'];  // Limit to fastest processing formats
    if (!supportedTypes.includes(fileType)) {
      throw new Error(`Currently supporting only ${supportedTypes.join(', ')} files for faster processing. Please convert other formats to PDF.`);
    }
    
    // Download the file
    console.log('Downloading file...');
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error('Download failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    // Save to temp file
    tempFilePath = path.join(tempDir, `temp_${Date.now()}_${cleanFileName}`);
    console.log('Saving to temp path:', tempFilePath);
    const buffer = await response.buffer();
    fs.writeFileSync(tempFilePath, buffer);

    // Get loader and load content
    console.log('Loading document content...');
    const loader = getFileLoader(tempFilePath, fileType);
    const docs = await loader.load();
    
    if (docs.length === 0) {
      throw new Error('No content could be extracted from the document');
    }

    // Split into smaller chunks and process in batches
    console.log('Splitting document into chunks...');
    const splitDocs = await textSplitter.splitDocuments(docs);
    const BATCH_SIZE = 1; // Process one chunk at a time
    
    let processedChunks = 0;
    const totalChunks = splitDocs.length;

    // Process each chunk individually to stay within time limits
    console.log(`Processing ${totalChunks} chunks...`);
    for (let i = 0; i < splitDocs.length; i++) {
      const doc = splitDocs[i];
      await addDocumentToStore(doc.pageContent, {
        fileName: cleanFileName,
        pageNumber: doc.metadata.pageNumber,
        chunkNumber: i + 1,
        totalChunks
      });
      
      processedChunks++;
      console.log(`Processed chunk ${processedChunks} of ${totalChunks}`);
    }

    return {
      success: true,
      message: `Processed ${processedChunks} chunks from ${cleanFileName}`,
      chunks: processedChunks,
      status: 'complete'
    };
  } catch (error) {
    console.error('Error processing document:', {
      error: error.message,
      stack: error.stack,
      fileUrl,
      fileName,
      tempFilePath
    });
    throw error;
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Cleaned up temp file:', tempFilePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }
};

// Optimize the question handling for faster response
export const handleQuestion = async (question, chatHistory = []) => {
  try {
    // Limit to 3 most relevant documents for faster processing
    const relevantDocs = await searchSimilarDocuments(question, 3);
    
    if (!relevantDocs || relevantDocs.length === 0) {
      return {
        answer: "I don't have any relevant information to answer this question. Please try uploading some documents first.",
        sources: []
      };
    }

    // Limit context size
    const context = relevantDocs
      .map(doc => {
        const metadata = doc.metadata || {};
        const sourceInfo = metadata.fileName ? ` [Source: ${metadata.fileName}]` : '';
        return doc.pageContent.substring(0, 1000) + sourceInfo; // Limit each chunk size
      })
      .join('\n\n')
      .substring(0, 3000); // Limit total context size

    // Limit chat history
    const recentHistory = chatHistory.slice(-3).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant. Be concise. Context:\n${context}`
    };

    const response = await llm.chat([
      systemMessage,
      ...recentHistory,
      { role: 'user', content: question }
    ]);

    return {
      answer: response.content,
      sources: relevantDocs.slice(0, 2).map(doc => ({
        content: doc.pageContent.substring(0, 200),
        metadata: doc.metadata,
      }))
    };
  } catch (error) {
    console.error('Error handling question:', error);
    throw error;
  }
}; 