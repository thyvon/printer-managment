<?php

namespace App\Notifications;

use App\Models\ServiceTicket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServiceTicketAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ServiceTicket $ticket,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $priority = ucfirst($this->ticket->priority);

        return (new MailMessage)
            ->subject("Service Ticket Assigned: {$this->ticket->title}")
            ->line("You have been assigned a **{$priority}** priority service ticket.")
            ->line("**{$this->ticket->title}**")
            ->line($this->ticket->description ?: 'No description provided.')
            ->action('View Ticket', url('/maintenance'))
            ->line('Please review and update the ticket status as needed.');
    }
}
