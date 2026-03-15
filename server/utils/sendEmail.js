import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send job application confirmation email to user
export const sendApplicationConfirmation = async (userEmail, userName, jobTitle, companyName) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
        console.error('Email config missing: EMAIL_USER or EMAIL_PASSWORD not set in .env');
        return { success: false, error: 'Email credentials not configured' };
    }

    try {
        const transporter = createTransporter();

        // Verify connection before sending
        await transporter.verify();

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Job Portal'}" <${emailUser}>`,
            to: userEmail,
            subject: `Application Confirmation - ${jobTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Application Received!</h2>
                    
                    <p style="color: #555; font-size: 16px;">Dear ${userName},</p>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Thank you for applying to the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.
                    </p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <p style="margin: 0; color: #333; font-size: 14px;">
                            ✓ Your application has been successfully submitted and is now under review.
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Our team will carefully review your application and get back to you soon. If your qualifications match our requirements, we will contact you for the next steps in the hiring process.
                    </p>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        In the meantime, you can track your application status by logging into your account.
                    </p>
                    
                    <p style="color: #555; font-size: 14px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>${companyName}</strong>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${userEmail} | MessageId: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

// Send application status email (Accepted or Rejected)
export const sendApplicationStatusEmail = async (userEmail, userName, jobTitle, companyName, status) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('Email config missing: EMAIL_USER or EMAIL_PASSWORD not set in .env');
        return { success: false, error: 'Email credentials not configured' };
    }

    const isAccepted = status === 'Accepted';

    const subject = isAccepted
        ? `Congratulations! Your application for ${jobTitle} has been Accepted`
        : `Update on your application for ${jobTitle}`;

    const accentColor = isAccepted ? '#4CAF50' : '#f44336';
    const icon = isAccepted ? '🎉' : '📋';

    const bodyHtml = isAccepted
        ? `<p style="color:#555;font-size:14px;line-height:1.6;">
               We are pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color:#4CAF50;">accepted</strong>.
           </p>
           <div style="background:#f0fff0;padding:15px;border-left:4px solid #4CAF50;margin:20px 0;">
               <p style="margin:0;color:#333;font-size:14px;">✓ Our team will reach out to you shortly with the next steps in the hiring process.</p>
           </div>
           <p style="color:#555;font-size:14px;line-height:1.6;">Please keep an eye on your inbox for further communication from us.</p>`
        : `<p style="color:#555;font-size:14px;line-height:1.6;">
               Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
           </p>
           <div style="background:#fff5f5;padding:15px;border-left:4px solid #f44336;margin:20px 0;">
               <p style="margin:0;color:#333;font-size:14px;">After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
           </div>
           <p style="color:#555;font-size:14px;line-height:1.6;">We encourage you to apply for future openings that match your skills and experience. We wish you the best in your job search.</p>`;

    try {
        const transporter = createTransporter();
        await transporter.verify();

        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Job Portal'}" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
                    <h2 style="color:#333;border-bottom:2px solid ${accentColor};padding-bottom:10px;">${icon} Application ${status}</h2>
                    <p style="color:#555;font-size:16px;">Dear ${userName},</p>
                    ${bodyHtml}
                    <p style="color:#555;font-size:14px;margin-top:30px;">
                        Best regards,<br>
                        <strong>${companyName}</strong>
                    </p>
                    <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
                    <p style="color:#999;font-size:12px;text-align:center;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `
        });

        console.log(`✅ Status email (${status}) sent to ${userEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Status email failed: ${error.message}`);
        return { success: false, error: error.message };
    }
};
