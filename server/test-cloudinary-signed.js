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
        console.log("Testing Cloudinary with signed URLs...");
        
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

        // Upload with signed URL
        console.log("Uploading with signed URL configuration...");
        const upload = await cloudinary.uploader.upload('dummy.pdf', {
            resource_type: 'raw',
            public_id: `signed_resume_${Date.now()}`,
            type: 'upload',
            sign_url: true,
            folder: 'resumes'
        });
        
        console.log("Upload URL:", upload.secure_url);
        console.log("Upload public_id:", upload.public_id);

        // Generate a signed URL for access
        const signedUrl = cloudinary.utils.private_download_url(upload.public_id, 'pdf', {
            resource_type: 'raw',
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        });
        
        console.log("Signed URL:", signedUrl);

        try {
            const response = await axios.get(upload.secure_url);
            console.log("Direct URL SUCCESS - Status:", response.status);
        } catch (err) {
            console.log("Direct URL FAILED:", err.response ? err.response.status : err.message);
            
            // Try signed URL
            try {
                const signedResponse = await axios.get(signedUrl);
                console.log("Signed URL SUCCESS - Status:", signedResponse.status);
            } catch (signedErr) {
                console.log("Signed URL FAILED:", signedErr.response ? signedErr.response.status : signedErr.message);
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