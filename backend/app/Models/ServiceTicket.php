<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use App\Notifications\ServiceTicketAssignedNotification;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'customer_id', 'site_id', 'printer_id', 'title', 'description', 'status', 'priority', 'assigned_user_id', 'scheduled_at', 'started_at', 'completed_at', 'parts_used'])]
class ServiceTicket extends Model
{
    use BelongsToCompany, HasFactory, SoftDeletes;

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::updated(function (ServiceTicket $ticket) {
            if ($ticket->wasChanged('assigned_user_id') && $ticket->assigned_user_id) {
                $user = User::find($ticket->assigned_user_id);
                if ($user) {
                    $user->notify(new ServiceTicketAssignedNotification($ticket));
                }
            }
        });
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
