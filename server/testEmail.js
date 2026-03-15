import dotenv from 'dotenv';
import { sendApplicationConfirmation } from './utils/sendEmail.js';

// Load environment variables
dotenv.config();

// Test email configuration
const testEmailSetup = async () => {
    console.log('🧪 Testing Email Configuration...\n');
    
    // Check if environment variables are set
    console.log('📋 Environment Variables:');
    console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || '❌ Not set'}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ Not set'}`);
    console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
    console.log(`   EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || '❌ Not set'}\n`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Error: EMAIL_USER and EMAIL_PASSWORD must be set in .env file');
        console.log('\n📖 Please refer to EMAIL_SETUP_GUIDE.md for configuration instructions');
        process.exit(1);
    }
    
    // Test data
    const testData = {
        userEmail: process.env.EMAIL_USER, // Send to yourself for testing
        userName: 'Test Candidate',
        jobTitle: 'Senior Software Developer',
        companyName: 'Test Company Inc.'
    };
    
    console.log('📧 Sending test email...');
    console.log(`   To: ${testData.userEmail}`);
    console.log(`   Job: ${testData.jobTitle}`);
    console.log(`   Company: ${testData.companyName}\n`);
    
    try {
        const result = await sendApplicationConfirmation(
            testData.userEmail,
            testData.userName,
            testData.jobTitle,
            testData.companyName
        );
        
        if (result.success) {
            console.log('✅ Success! Test email sent successfully!');
            console.log('📬 Check your inbox:', testData.userEmail);
            console.log('💡 If you don\'t see it, check your spam folder\n');
        } else {
            console.error('❌ Failed to send email:', result.error);
            console.log('\n📖 Troubleshooting tips:');
            console.log('   1. Verify EMAIL_USER and EMAIL_PASSWORD are correct');
            console.log('   2. For Gmail, use App Password (not regular password)');
            console.log('   3. Enable 2-Step Verification for Gmail');
            console.log('   4. Check EMAIL_SETUP_GUIDE.md for detailed instructions\n');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📖 Please check EMAIL_SETUP_GUIDE.md for troubleshooting\n');
    }
};

// Run the test
testEmailSetup();
