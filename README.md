# Stock Management Dashboard (Next.js + Laravel API)

This is a production-ready Stock Management Dashboard built with **Next.js 15, React 19, TypeScript, and Tailwind CSS**, using a **Laravel API** backend. It provides end-to-end workflows for managing materials, inventory transactions, consumption lists, requisitions, and user administration.

- Live Frontend: https://stock-management-rho-silk.vercel.app/
- Production API Base: https://stock.biznessimpact.com/api/v1
- Auth Base: https://stock.biznessimpact.com (e.g., POST /api/login)

## Overview

The app offers a clean, responsive admin experience with role-ready endpoints. It’s built on a solid API layer (`src/lib/api.ts`) that centralizes all HTTP calls, token handling, and error logging.

### Highlight Features
- Materials management with extra fields and images
- Inventory transactions: stock-in, stock-out, and adjustments
- Consumption lists (bill-of-materials style entries)
- Requisitions workflow: create, list, approve, reject
- Notifications feed
- User management (activate/deactivate)
- Theming via Tailwind and a modern dashboard UI

### Tech Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS v4
- Axios for HTTP
- Laravel (API v1) on the backend

## Architecture & Key Files
- `src/lib/api.ts`
  - Centralized Axios clients, auth interceptor (Authorization: Bearer token), and typed API wrappers.
  - Environment-driven base URLs:
    - `NEXT_PUBLIC_API_BASE_URL` → e.g., `https://stock.biznessimpact.com/api/v1`
    - `NEXT_PUBLIC_AUTH_BASE_URL` → e.g., `https://stock.biznessimpact.com`
  - Helper `getImageUrl` builds absolute URLs from the API origin for images.

## Environment & Configuration
Create `.env.local` for local development:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:8000
```

Set the following on Vercel (Project → Settings → Environment Variables):

```
NEXT_PUBLIC_API_BASE_URL=https://stock.biznessimpact.com/api/v1
NEXT_PUBLIC_AUTH_BASE_URL=https://stock.biznessimpact.com
```

## Running Locally
```
npm install
npm run dev
# App will start at http://localhost:3000
```

Ensure the Laravel API is running locally at `http://localhost:8000` and CORS allows `http://localhost:3000`.

## Deploy
- Frontend: Vercel (uses env vars above)
- Backend: Laravel on your server with document root pointing to `public/` and rewrites enabled
- CORS (Laravel `config/cors.php`):
  - `allowed_origins` should include `https://stock-management-rho-silk.vercel.app`
  - Typical headers: `Content-Type, Accept, Authorization, X-Requested-With`

## Example API Workflows
- Auth: `POST {AUTH_BASE}/api/login` stores token (frontend adds `Authorization: Bearer <token>` via interceptor)
- Materials: `GET {API_BASE}/materials`, `POST /materials`, `PUT /materials/{id}`
- Inventory: `POST /materials/{id}/stock-in`, `POST /materials/{id}/stock-out`, `POST /materials/{id}/adjust`
- Requisitions: `POST /requisitions`, `GET /requisitions`, `POST /requisitions/{id}/approve|reject`

## Security Notes
- No cookies required; token is sent in the `Authorization` header.
- For production, ensure HTTPS termination and correct `APP_URL` on the backend.

## Credits
This UI is based on the excellent TailAdmin template (details below). API and integration logic have been customized for the Stock Management domain.

---

# TailAdmin Next.js - Free Next.js Tailwind Admin Dashboard Template

TailAdmin is a free and open-source admin dashboard template built on **Next.js and Tailwind CSS** providing developers with everything they need to create a feature-rich and data-driven: back-end, dashboard, or admin panel solution for any sort of web project.

![TailAdmin - Next.js Dashboard Preview](./banner.png)

With TailAdmin Next.js, you get access to all the necessary dashboard UI components, elements, and pages required to build a high-quality and complete dashboard or admin panel. Whether you're building a dashboard or admin panel for a complex web application or a simple website. 

TailAdmin utilizes the powerful features of **Next.js 15** and common features of Next.js such as server-side rendering (SSR), static site generation (SSG), and seamless API route integration. Combined with the advancements of **React 19** and the robustness of **TypeScript**, TailAdmin is the perfect solution to help get your project up and running quickly.

## Overview

TailAdmin provides essential UI components and layouts for building feature-rich, data-driven admin dashboards and control panels. It's built on:

- Next.js 15.x
- React 19
- TypeScript
- Tailwind CSS V4

### Quick Links
- [✨ Visit Website](https://tailadmin.com)
- [📄 Documentation](https://tailadmin.com/docs)
- [⬇️ Download](https://tailadmin.com/download)
- [🖌️ Figma Design File (Community Edition)](https://www.figma.com/community/file/1463141366275764364)
- [⚡ Get PRO Version](https://tailadmin.com/pricing)

### Demos
- [Free Version](https://nextjs-free-demo.tailadmin.com)
- [Pro Version](https://nextjs-demo.tailadmin.com)

### Other Versions
- [HTML Version](https://github.com/TailAdmin/tailadmin-free-tailwind-dashboard-template)
- [React Version](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard)
- [Vue.js Version](https://github.com/TailAdmin/vue-tailwind-admin-dashboard)

## Installation

### Prerequisites
To get started with TailAdmin, ensure you have the following prerequisites installed and set up:

- Node.js 18.x or later (recommended to use Node.js 20.x or later)

### Cloning the Repository
Clone the repository using the following command:

```bash
git clone https://github.com/TailAdmin/free-nextjs-admin-dashboard.git
```

> Windows Users: place the repository near the root of your drive if you face issues while cloning.

1. Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
    > Use `--legacy-peer-deps` flag if you face peer-dependency error during installation.

2. Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

## Components

TailAdmin is a pre-designed starting point for building a web-based dashboard using Next.js and Tailwind CSS. The template includes:

- Sophisticated and accessible sidebar
- Data visualization components
- Profile management and custom 404 page
- Tables and Charts(Line and Bar)
- Authentication forms and input elements
- Alerts, Dropdowns, Modals, Buttons and more
- Can't forget Dark Mode 🕶️

All components are built with React and styled using Tailwind CSS for easy customization.

## Feature Comparison

### Free Version
- 1 Unique Dashboard
- 30+ dashboard components
- 50+ UI elements
- Basic Figma design files
- Community support

### Pro Version
- 5 Unique Dashboards: Analytics, Ecommerce, Marketing, CRM, Stocks (more coming soon)
- 400+ dashboard components and UI elements
- Complete Figma design file
- Email support

To learn more about pro version features and pricing, visit our [pricing page](https://tailadmin.com/pricing).

## Changelog

### Version 2.0.2 - [March 25, 2025]

- Upgraded to Next v15.2.3 for [CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927) concerns
- Included overrides vectormap for packages to prevent peer dependency errors during installation.
- Migrated from react-flatpickr to flatpickr package for React 19 support

### Version 2.0.1 - [February 27, 2025]

#### Update Overview

- Upgraded to Tailwind CSS v4 for better performance and efficiency.
- Updated class usage to match the latest syntax and features.
- Replaced deprecated class and optimized styles.

#### Next Steps

- Run npm install or yarn install to update dependencies.
- Check for any style changes or compatibility issues.
- Refer to the Tailwind CSS v4 [Migration Guide](https://tailwindcss.com/docs/upgrade-guide) on this release. if needed.
- This update keeps the project up to date with the latest Tailwind improvements. 🚀

### v2.0.0 (February 2025)
A major update focused on Next.js 15 implementation and comprehensive redesign.

#### Major Improvements
- Complete redesign using Next.js 15 App Router and React Server Components
- Enhanced user interface with Next.js-optimized components
- Improved responsiveness and accessibility
- New features including collapsible sidebar, chat screens, and calendar
- Redesigned authentication using Next.js App Router and server actions
- Updated data visualization using ApexCharts for React

#### Breaking Changes

- Migrated from Next.js 14 to Next.js 15
- Chart components now use ApexCharts for React
- Authentication flow updated to use Server Actions and middleware

[Read more](https://tailadmin.com/docs/update-logs/nextjs) on this release.

#### Breaking Changes
- Migrated from Next.js 14 to Next.js 15
- Chart components now use ApexCharts for React
- Authentication flow updated to use Server Actions and middleware

### v1.3.4 (July 01, 2024)
- Fixed JSvectormap rendering issues

### v1.3.3 (June 20, 2024)
- Fixed build error related to Loader component

### v1.3.2 (June 19, 2024)
- Added ClickOutside component for dropdown menus
- Refactored sidebar components
- Updated Jsvectormap package

### v1.3.1 (Feb 12, 2024)
- Fixed layout naming consistency
- Updated styles

### v1.3.0 (Feb 05, 2024)
- Upgraded to Next.js 14
- Added Flatpickr integration
- Improved form elements
- Enhanced multiselect functionality
- Added default layout component

## License

TailAdmin Next.js Free Version is released under the MIT License.

## Support

If you find this project helpful, please consider giving it a star on GitHub. Your support helps us continue developing and maintaining this template.
