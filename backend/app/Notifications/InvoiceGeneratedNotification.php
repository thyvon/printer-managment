<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

class InvoiceGeneratedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (config('services.telegram.bot_token')) {
            $channels[] = 'telegram';
        } elseif (config('mail.default') !== 'log') {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Invoice: {$this->invoice->invoice_number}")
            ->line("Invoice **{$this->invoice->invoice_number}** has been generated.")
            ->line("Customer: {$this->invoice->customer->name}")
            ->line("Period: {$this->invoice->period_start} to {$this->invoice->period_end}")
            ->line("Total: {$this->invoice->currency} ".number_format($this->invoice->total, 2))
            ->action('View Invoice', url("/invoices/{$this->invoice->id}"))
            ->line('Please review and send to the customer.');
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'title' => 'Invoice Generated',
            'message' => "{$this->invoice->invoice_number} — {$this->invoice->currency} ".number_format($this->invoice->total, 2),
            'url' => "/invoices/{$this->invoice->id}",
            'type' => 'success',
        ]);
    }

    public function toTelegram(object $notifiable): TelegramMessage
    {
        return TelegramMessage::create()
            ->content("📄 *Invoice Generated*\n\n*{$this->invoice->invoice_number}*\nCustomer: {$this->invoice->customer->name}\nPeriod: {$this->invoice->period_start} → {$this->invoice->period_end}\nTotal: {$this->invoice->currency} ".number_format($this->invoice->total, 2));
    }
}
