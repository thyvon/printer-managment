<?php

namespace App\Notifications;

use App\Models\Toner;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

class TonerLowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Toner $toner,
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
            ->subject("Low Toner Stock: {$this->toner->name}")
            ->line("The toner **{$this->toner->name}** ({$this->toner->part_number}) is running low.")
            ->line("Current stock: {$this->toner->current_stock} {$this->toner->unit}")
            ->line("Threshold: {$this->toner->low_stock_threshold} {$this->toner->unit}")
            ->action('View Toner', url('/toners'))
            ->line('Please restock soon to avoid service disruptions.');
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'title' => 'Low Toner Stock',
            'message' => "{$this->toner->name} ({$this->toner->part_number}) is running low — {$this->toner->current_stock} {$this->toner->unit} remaining.",
            'url' => '/toners',
            'type' => 'warning',
        ]);
    }

    public function toTelegram(object $notifiable): TelegramMessage
    {
        return TelegramMessage::create()
            ->content("⚠️ *Low Toner Stock*\n\n*{$this->toner->name}* ({$this->toner->part_number})\nStock: {$this->toner->current_stock} {$this->toner->unit}\nThreshold: {$this->toner->low_stock_threshold} {$this->toner->unit}\n\nPlease restock soon.");
    }
}
