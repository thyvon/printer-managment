<?php

namespace App\Notifications;

use App\Models\Toner;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TonerLowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Toner $toner,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Low Toner Stock: {$this->toner->name}")
            ->line("The toner **{$this->toner->name}** ({$this->toner->part_number}) is running low.")
            ->line("Current stock: {$this->toner->current_stock} {$this->toner->unit}")
            ->line("Threshold: {$this->toner->low_stock_threshold} {$this->toner->unit}")
            ->action('View Toner', url('/toners'))
            ->line('Please restock soon to avoid service disruptions.');
    }
}
