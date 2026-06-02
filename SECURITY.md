# Security Policy

## Supported Versions
Currently, only the main production branch of Shyamved Residency Management System receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an e-mail to the system administrator or chairman. All security vulnerabilities will be promptly addressed.

## Architecture & Protections

1. **Row Level Security (RLS)**: All Supabase tables are strictly protected via Postgres RLS.
2. **Environment Variables**: Sensitive keys (Supabase Anon Key, Razorpay Key) must never be hardcoded.
3. **Role-Based Access Control (RBAC)**: App-level logic enforces `chairman`, `office_man`, and `resident` scopes.

**Do not attempt to bypass RLS policies in production for administrative convenience.**
