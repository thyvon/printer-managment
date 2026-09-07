<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceGeneratedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
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
}
