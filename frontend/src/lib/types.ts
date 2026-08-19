export type Company = {
  id: number;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  status: string;
  device_limit: number;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  company_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  company?: Company;
};

export type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: "USD" | "KHR";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  sites_count?: number;
  sites?: Site[];
  contacts?: Contact[];
};

export type Site = {
  id: number;
  customer_id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: number;
  customer_id: number;
  site_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

export type Printer = {
  id: number;
  site_id: number;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  ip_address: string | null;
  snmp_community: string | null;
  status: "online" | "offline" | "maintenance";
  created_at: string;
  updated_at: string;
};

export type PricingTier = {
  id?: number;
  contract_id?: number;
  name: string;
  currency: "USD" | "KHR";
  included_mono_pages: number;
  included_color_pages: number;
  mono_rate: number;
  color_rate: number;
};

export type Contract = {
  id: number;
  customer_id: number;
  name: string;
  status: "active" | "pending" | "expired" | "cancelled";
  monthly_fee: string | number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  pricing_tiers?: PricingTier[];
};

export type Collector = {
  id: number;
  site_id: number;
  name: string;
  version: string | null;
  last_seen_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CounterReading = {
  id: number;
  collector_id: number;
  printer_id: number;
  total_pages: number;
  mono_pages: number;
  color_pages: number;
  read_at: string;
};

export type Usage = {
  id: number;
  printer_id: number;
  period_start: string;
  period_end: string;
  total_pages: number;
  mono_pages: number;
  color_pages: number;
  printer?: Printer;
};

export type InvoiceLine = {
  id: number;
  description: string;
  kind: "monthly_fee" | "mono_overage" | "color_overage";
  currency: "USD" | "KHR";
  quantity: number;
  unit_price: number;
  amount: number;
};

export type Invoice = {
  id: number;
  customer_id: number;
  contract_id: number;
  invoice_number: string;
  period_start: string;
  period_end: string;
  currency: "USD" | "KHR";
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  created_at: string;
  updated_at: string;
  lines?: InvoiceLine[];
  customer?: Customer;
};

export type Paginated<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

export type DashboardSummary = {
  counts: {
    customers: number;
    sites: number;
    printers: number;
    active_contracts: number;
  };
  invoices_this_month: {
    count: number;
    total: number;
  };
  usage_trend: Array<{
    month: string;
    total_pages: number;
    mono_pages: number;
    color_pages: number;
  }>;
  recent_invoices: Invoice[];
  printers: Printer[];
  customers: Customer[];
};