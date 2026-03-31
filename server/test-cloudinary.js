import { v2 as cloudinary } from "cloudinary";
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const run = async () => {
    try {
        // Test Cloudinary connection first
        console.log("Testing Cloudinary connection...");
        const result = await cloudinary.api.ping();
        console.log("Cloudinary connection:", result);

        // Create a proper dummy PDF
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
301
%%EOF`;

        fs.writeFileSync('dummy.pdf', pdfContent);

        console.log("Uploading as raw (recommended for PDFs)...");
        const upload1 = await cloudinary.uploader.upload('dummy.pdf', {
            resource_type: 'raw',
            public_id: `test_resume_${Date.now()}`,
            type: 'upload',
            access_mode: 'public'  // Ensure public access
        });
        console.log("Upload1 URL:", upload1.secure_url);
        console.log("Upload1 public_id:", upload1.public_id);

        try {
            const response = await axios.get(upload1.secure_url);
            console.log("Upload1 fetching SUCCESS - Status:", response.status);
        } catch (err) {
            console.log("Upload1 fetching FAILED:", err.response ? err.response.status : err.message);
            
            // Try alternative URL format
            const altUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/raw/upload/${upload1.public_id}.pdf`;
            console.log("Trying alternative URL:", altUrl);
            try {
                const altResponse = await axios.get(altUrl);
                console.log("Alternative URL SUCCESS - Status:", altResponse.status);
            } catch (altErr) {
                console.log("Alternative URL FAILED:", altErr.response ? altErr.response.status : altErr.message);
            }
        }

        // Clean up
        fs.unlinkSync('dummy.pdf');

    } catch (err) {
        console.error("Test failed", err.message);
        if (err.http_code) {
            console.error("HTTP Code:", err.http_code);
        }
    }
}

run();
