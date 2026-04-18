import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly appUrl: string;
  private readonly fromName: string;
  private readonly fromAddress: string | null;
  private readonly smtpHost: string | null;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;
  private readonly smtpUser: string | null;
  private readonly smtpPass: string | null;
  private transporter: Transporter | null = null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.appUrl = this.configService.get("APP_URL", "http://localhost:3000");
    this.fromName = this.configService.get("MAIL_FROM_NAME", "Forum RPG");
    this.fromAddress = this.configService.get("MAIL_FROM_ADDRESS") ?? null;
    this.smtpHost = this.configService.get("SMTP_HOST") ?? null;
    this.smtpPort = Number(this.configService.get("SMTP_PORT", "587"));
    this.smtpSecure = this.configService.get("SMTP_SECURE", "false") === "true";
    this.smtpUser = this.configService.get("SMTP_USER") ?? null;
    this.smtpPass = this.configService.get("SMTP_PASS") ?? null;
  }

  async sendVerificationEmail(payload: {
    email: string;
    username: string;
    token: string;
  }) {
    const link = `${this.appUrl}/verify-email?token=${payload.token}`;

    await this.send({
      to: payload.email,
      subject: "Zweryfikuj konto w Forum RPG",
      text: [
        `Czesc ${payload.username},`,
        "",
        "Aby aktywowac konto, kliknij ponizszy link:",
        link,
        "",
        "Jesli to nie Ty zakladales konto, zignoruj te wiadomosc.",
      ].join("\n"),
      html: [
        `<p>Czesc ${escapeHtml(payload.username)},</p>`,
        "<p>Aby aktywowac konto, kliknij ponizszy link:</p>",
        `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`,
        "<p>Jesli to nie Ty zakladales konto, zignoruj te wiadomosc.</p>",
      ].join(""),
    });
  }

  async sendPasswordResetEmail(payload: {
    email: string;
    username: string;
    token: string;
  }) {
    const link = `${this.appUrl}/reset-password?token=${payload.token}`;

    await this.send({
      to: payload.email,
      subject: "Reset hasla w Forum RPG",
      text: [
        `Czesc ${payload.username},`,
        "",
        "Aby ustawic nowe haslo, kliknij ponizszy link:",
        link,
        "",
        "Jesli nie prosiles o reset, zignoruj te wiadomosc.",
      ].join("\n"),
      html: [
        `<p>Czesc ${escapeHtml(payload.username)},</p>`,
        "<p>Aby ustawic nowe haslo, kliknij ponizszy link:</p>",
        `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`,
        "<p>Jesli nie prosiles o reset, zignoruj te wiadomosc.</p>",
      ].join(""),
    });
  }

  async sendNotificationEmail(payload: {
    email: string;
    username: string;
    title: string;
    message: string;
    link?: string | null;
  }) {
    const resolvedLink = payload.link ? `${this.appUrl}${payload.link}` : null;

    await this.send({
      to: payload.email,
      subject: `${payload.title} | Forum RPG`,
      text: [
        `Czesc ${payload.username},`,
        "",
        payload.message,
        resolvedLink ? "" : null,
        resolvedLink ?? null,
      ]
        .filter(Boolean)
        .join("\n"),
      html: [
        `<p>Czesc ${escapeHtml(payload.username)},</p>`,
        `<p>${escapeHtml(payload.message)}</p>`,
        resolvedLink
          ? `<p><a href="${escapeHtml(resolvedLink)}">Otworz powiadomienie</a></p>`
          : "",
      ].join(""),
    });
  }

  private async send(payload: MailPayload) {
    const transporter = this.getTransporter();

    if (!transporter || !this.fromAddress) {
      this.logger.log(
        [
          `Mail fallback -> ${payload.to}`,
          `Temat: ${payload.subject}`,
          payload.text,
        ].join("\n"),
      );
      return;
    }

    try {
      await transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    } catch (error) {
      this.logger.error(`Nie udalo sie wyslac maila do ${payload.to}.`, error);
    }
  }

  private getTransporter() {
    if (!this.smtpHost || !this.fromAddress) {
      return null;
    }

    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth:
        this.smtpUser && this.smtpPass
          ? {
              user: this.smtpUser,
              pass: this.smtpPass,
            }
          : undefined,
    });

    return this.transporter;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
