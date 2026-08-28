import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let etherealAccount: { user: string; pass: string; web?: string } | null = null;

export async function getEtherealTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  const envUser = process.env.ETHEREAL_USER;
  const envPass = process.env.ETHEREAL_PASSWORD;

  if (envUser && envPass) {
    transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.ETHEREAL_PORT) || 587,
      secure: false,
      auth: {
        user: envUser,
        pass: envPass,
      },
    });
    etherealAccount = { user: envUser, pass: envPass };
    console.log(`✅ Using configured Ethereal SMTP account: ${envUser}`);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    etherealAccount = {
      user: testAccount.user,
      pass: testAccount.pass,
      web: testAccount.web,
    };

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`✅ Dynamically created Ethereal SMTP account: ${testAccount.user}`);
  }

  return transporter;
}

export interface SendEmailPayload {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendEmailViaEthereal(payload: SendEmailPayload): Promise<SendEmailResult> {
  const mailer = await getEtherealTransporter();

  const info = await mailer.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
    html: payload.body.replace(/\n/g, '<br/>'),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📨 Sent email to ${payload.to} via Ethereal. Preview: ${previewUrl || 'N/A'}`);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
