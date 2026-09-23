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
  is_platform_admin: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
  company?: Company;
};

export type ServiceTicket = {
  id: number;
  customer_id: number;
  site_id: number | null;
  printer_id: number | null;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_user_id: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  parts_used: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  site?: Site;
  printer?: Printer;
  assigned_user?: User;
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
  toner_levels: Record<string, { current: number; max: number; percent: number }> | null;
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

export type Toner = {
  id: number;
  name: string;
  part_number: string | null;
  color: "black" | "cyan" | "magenta" | "yellow" | null;
  printer_models: string | null;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
  unit_cost: string | number | null;
  supplier: string | null;
  supplier_part_number: string | null;
  notes: string | null;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
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
  low_stock_toners: Array<{
    id: number;
    name: string;
    part_number: string | null;
    color: string | null;
    current_stock: number;
    low_stock_threshold: number;
    unit: string;
  }>;
  open_tickets: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    customer_name: string | null;
    printer_name: string | null;
    scheduled_at: string | null;
  }>;
  low_toner_printers: Array<{
    id: number;
    name: string;
    site_name: string | null;
    customer_name: string | null;
    toner_levels: Record<string, { current: number; max: number; percent: number }>;
  }>;
};

export type PlatformSummary = {
  summary: {
    total_tenants: number;
    active_tenants: number;
    trial_tenants: number;
    total_users: number;
    total_printers: number;
    total_customers: number;
    total_sites: number;
  };
  plans: {
    starter: number;
    growth: number;
    enterprise: number;
  };
  mrr: {
    total: number;
    count: number;
  };
  recent_tenants: Array<{
    id: number;
    name: string;
    plan: string;
    status: string;
    created_at: string;
  }>;
};

export type TenantDetail = Company & {
  users_count: number;
  printers_count: number;
  customers_count: number;
  sites_count: number;
  contracts_count: number;
  recent_invoices: Invoice[];
  recent_users: User[];
};

export type AppNotification = {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    url: string;
    type: "info" | "warning" | "success" | "error";
  };
  read_at: string | null;
  created_at: string;
};