<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .meta div { width: 48%; }
        .meta p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { text-align: right; margin-top: 20px; }
        .totals table { width: 300px; margin-left: auto; }
        .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
    </div>

    <div class="meta">
        <div>
            <p><strong>Invoice #:</strong> {{ $invoice->invoice_number }}</p>
            <p><strong>Period:</strong> {{ $invoice->period_start->format('M d, Y') }} - {{ $invoice->period_end->format('M d, Y') }}</p>
            <p><strong>Status:</strong> {{ ucfirst($invoice->status) }}</p>
        </div>
        <div>
            <p><strong>Bill To:</strong></p>
            <p>{{ $invoice->customer->name }}</p>
            @if($invoice->customer->email)
                <p>{{ $invoice->customer->email }}</p>
            @endif
            @if($invoice->customer->address)
                <p>{{ $invoice->customer->address }}</p>
            @endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->lines as $line)
            <tr>
                <td>{{ $line->description }}</td>
                <td>{{ $line->quantity }}</td>
                <td>{{ $invoice->currency }} {{ number_format($line->unit_price, 2) }}</td>
                <td>{{ $invoice->currency }} {{ number_format($line->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td><strong>Subtotal:</strong></td>
                <td>{{ $invoice->currency }} {{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
            @if($invoice->tax > 0)
            <tr>
                <td><strong>Tax:</strong></td>
                <td>{{ $invoice->currency }} {{ number_format($invoice->tax, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td><strong>Total:</strong></td>
                <td><strong>{{ $invoice->currency }} {{ number_format($invoice->total, 2) }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Thank you for your business.</p>
    </div>
</body>
</html>
