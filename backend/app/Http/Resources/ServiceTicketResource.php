<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'site_id' => $this->site_id,
            'printer_id' => $this->printer_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'assigned_user_id' => $this->assigned_user_id,
            'scheduled_at' => $this->scheduled_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'parts_used' => $this->parts_used,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'customer' => $this->whenLoaded('customer'),
            'site' => $this->whenLoaded('site'),
            'printer' => $this->whenLoaded('printer'),
            'assigned_user' => $this->whenLoaded('assignedUser'),
        ];
    }
}