import nodemailer from "nodemailer"
import Mail from "nodemailer/lib/mailer/index.js";
import { BadRequestException } from "../../exception/domain.exception.js";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = []
}:Mail.Options):Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  if(!to && !bcc){
    throw new BadRequestException("invalid recipinet")
  }

  if(!(html as string)?.length && attachments?.length){
    throw new BadRequestException("invalid mail content")
  }

  // Send an email using async/await
  try {
    await transporter.sendMail({
      from: `"social app" <${process.env.EMAIL_APP}>`,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new BadRequestException("Failed to send email");
  }
}