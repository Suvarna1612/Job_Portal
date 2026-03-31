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
           <div style="background:#e8f4fd;padding:15px;border-left:4px solid #2196F3;margin:20px 0;">
               <p style="margin:0;color:#333;font-size:14px;">💡 <strong>Get Ready for Success!</strong></p>
               <p style="margin:5px 0 0 0;color:#555;font-size:13px;">Use our "Prepare for Job" feature to practice interview questions and boost your confidence before the interview.</p>
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
// Send new job notification to company followers
export const sendNewJobNotification = async (userEmail, userName, jobTitle, companyName, jobId, jobLocation, jobSalary) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('Email config missing: EMAIL_USER or EMAIL_PASSWORD not set in .env');
        return { success: false, error: 'Email credentials not configured' };
    }

    try {
        const transporter = createTransporter();
        await transporter.verify();

        const jobUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/apply-job/${jobId}`;

        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Job Portal'}" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `New Job Alert: ${jobTitle} at ${companyName}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
                    <h2 style="color:#333;border-bottom:2px solid #4CAF50;padding-bottom:10px;">🔔 New Job Alert!</h2>
                    
                    <p style="color:#555;font-size:16px;">Dear ${userName},</p>
                    
                    <p style="color:#555;font-size:14px;line-height:1.6;">
                        Great news! <strong>${companyName}</strong>, a company you're following, has just posted a new job opportunity.
                    </p>
                    
                    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #4CAF50;">
                        <h3 style="margin:0 0 10px 0;color:#333;font-size:18px;">${jobTitle}</h3>
                        <p style="margin:5px 0;color:#666;"><strong>Company:</strong> ${companyName}</p>
                        <p style="margin:5px 0;color:#666;"><strong>Location:</strong> ${jobLocation}</p>
                        <p style="margin:5px 0;color:#666;"><strong>Salary:</strong> $${jobSalary}</p>
                    </div>
                    
                    <div style="text-align:center;margin:30px 0;">
                        <a href="${jobUrl}" 
                           style="background:#4CAF50;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">
                            View Job Details & Apply
                        </a>
                    </div>
                    
                    <p style="color:#555;font-size:14px;line-height:1.6;">
                        Don't miss out on this opportunity! Click the button above to learn more and submit your application.
                    </p>
                    
                    <p style="color:#555;font-size:14px;margin-top:30px;">
                        Best regards,<br>
                        <strong>Job Portal Team</strong>
                    </p>
                    
                    <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
                    
                    <p style="color:#999;font-size:12px;text-align:center;">
                        You're receiving this because you're following ${companyName}. 
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/following-companies" style="color:#4CAF50;">Manage your followed companies</a>
                    </p>
                </div>
            `
        });

        console.log(`✅ New job notification sent to ${userEmail} for ${jobTitle} at ${companyName}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ New job notification failed: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// Send chat message notification to candidate
export const sendChatMessageNotification = async (userEmail, userName, companyName, messagePreview, appUrl) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return { success: false }
    try {
        const transporter = createTransporter()
        await transporter.verify()
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Job Portal'}" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `New message from ${companyName}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
                    <h2 style="color:#333;border-bottom:2px solid #2563eb;padding-bottom:10px;">💬 New Message</h2>
                    <p style="color:#555;font-size:16px;">Hi ${userName},</p>
                    <p style="color:#555;font-size:14px;line-height:1.6;">
                        You have a new message from <strong>${companyName}</strong> regarding your job application.
                    </p>
                    <div style="background:#f0f4ff;padding:15px;border-left:4px solid #2563eb;margin:20px 0;border-radius:4px;">
                        <p style="margin:0;color:#333;font-size:14px;font-style:italic;">"${messagePreview}"</p>
                    </div>
                    <div style="text-align:center;margin:30px 0;">
                        <a href="${appUrl}" style="background:#2563eb;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                            View & Reply
                        </a>
                    </div>
                    <p style="color:#999;font-size:12px;text-align:center;margin-top:30px;">This is an automated notification from Job Portal.</p>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Chat notification email failed:', error.message)
        return { success: false }
    }
}
