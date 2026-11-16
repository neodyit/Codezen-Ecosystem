<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resetUrl;
    public string $name;

    /**
     * Create a new message instance.
     */
    public function __construct(string $resetUrl, string $name = 'Member')
    {
        $this->resetUrl = $resetUrl;
        $this->name = $name;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your CodeZen Account Password',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: '
            <div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 40px 30px; border-radius: 24px;">
                <div style="margin-bottom: 24px;">
                    <span style="font-size: 11px; font-family: monospace; letter-spacing: 0.2em; text-transform: uppercase; background: #1f1f1f; color: #a1a1aa; padding: 4px 10px; border-radius: 20px;">SECURITY NOTIFICATION</span>
                </div>
                <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.03em; margin: 0 0 12px 0; text-transform: uppercase;">CODEZEN PASSWORD RESET</h1>
                <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 28px 0;">
                    Hello ' . htmlspecialchars($this->name) . ', we received a request to reset your CodeZen Ecosystem password. Click the button below to choose a new password. This link is secure and valid for 60 minutes.
                </p>
                <div style="margin: 32px 0;">
                    <a href="' . htmlspecialchars($this->resetUrl) . '" style="display: inline-block; background-color: #ffffff; color: #000000; font-family: monospace; font-size: 13px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 16px; text-transform: uppercase; letter-spacing: 0.1em;">
                        Reset Password &rarr;
                    </a>
                </div>
                <p style="font-size: 12px; font-family: monospace; color: #71717a; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #27272a; padding-top: 20px;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>
            ',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
