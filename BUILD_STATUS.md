# Carbon Ledger — Build Status

Audit and implementation status of the Next.js App Router codebase. **Google Drive is the sole persistent store**; no SQL/NoSQL database is used.

---

## COMPLETE

- **Framework & Architecture**: Next.js 15 App Router, TypeScript, Tailwind CSS with Ocean Breeze tokens (`#F4F9FA` canvas, `#FFFFFF` cards, `#1F6F8B` primary, `#8ED1C6` Scope 1, `#F29E7D` Scope 2, `#16323F` ink, `#5B7480` muted text), Fraunces and Inter fonts.
- **Authentication & Security**:
  - Sign up, login, logout, forgot-password, and reset-password flows.
  - Password hashing with bcrypt (12 salt rounds) and hashed reset tokens with 1-hour expiration.
  - Signed HTTP-only cookie sessions using HMAC-SHA256 with timing-safe signature comparison.
  - Edge middleware (`middleware.ts`) protecting `/dashboard`, `/upload`, `/setup`, and all protected `/api/*` routes.
  - Server-side company isolation (company ID always extracted from the authenticated session, never trusted from client inputs).
  - Split-screen layout for authentication pages.
  - Development fallback for password reset links when email delivery is unconfigured.
- **Company Setup**:
  - Dynamic company setup form (`/setup`) allowing configuration of Company Name, Industry, Employee Count, and dynamic facility rows (Facility Name & Address).
  - Persistence of `company.json` and `facility.json` to Google Drive.
- **Scope 1 Upload & Processing**:
  - Scope 1 interface supporting Facility, Reporting Year (FY20–FY26), and Excel upload.
  - Header validation (`Equipment name`, `Source type`, `Fuel type`, `Quantity consumed`, `Unit`).
  - Source type validation (`Stationary`, `Mobile`) with case/whitespace normalization.
  - Fuel type validation (strictly `Diesel`, `Petrol`, `CNG`, `LNG` only) with case/whitespace normalization.
  - Numeric, non-negative quantity validation.
  - Combined error reporting: all row validation errors returned simultaneously in a single response.
  - Atomic validation: no files or partial metadata saved to Google Drive if any validation error exists.
- **Scope 2 Upload & Processing**:
  - Scope 2 interface supporting Facility, Reporting Year (FY20–FY26), and Excel upload.
  - Header validation (`Electricity source or meter name`, `Electricity consumed (kWh)`).
  - Numeric, non-negative kWh validation.
  - Scope restricted to purchased electricity only.
- **Duplicate Upload & Replacement Handling**:
  - Duplicate detection for `Company + Facility + Scope + Year`.
  - Confirmation dialog presenting **Replace** and **Cancel** options.
  - Validate-then-replace logic: replacement file must pass full validation before any existing data is overwritten. If replacement validation fails, existing data remains completely untouched.
- **Emission Factor Architecture**:
  - Centralized in `lib/emissionFactors.ts`.
  - Scope 1 sources: DEFRA/DESNZ 2020–2025.
  - Scope 2 sources: Latest CEA India grid emission factor.
  - Reference: IPCC EFDB.
  - **All factor values remain strictly `null`**.
  - Safe null-factor calculation and display handling throughout metrics and dashboards (emissions show "Emission factor unavailable", never calculating fake values).
- **Dashboard & Visualization**:
  - Tabs for **Overview**, **Scope 1**, and **Scope 2**.
  - Dropdown filters for Facility (All Facilities + individual facilities) and Reporting Year (only years with uploaded data).
  - Year-on-year (YoY) comparison with percentage and absolute changes where prior-year data exists.
  - Overview KPI cards: Total emissions, Scope 1 emissions, Scope 2 emissions, Change vs previous year.
  - Overview Charts: Scope 1 vs Scope 2 share (Pie), Total emissions by year (Bar), Emissions by facility (Bar).
  - Scope 1 KPI cards: Total Scope 1 emissions, Stationary emissions, Mobile emissions, Top fuel.
  - Scope 1 Charts: Emissions by fuel, Stationary vs Mobile, Top 5 equipment.
  - Scope 2 KPI cards: Total electricity consumed (kWh), Total Scope 2 emissions, Change vs previous year.
  - Scope 2 Charts: Emissions by facility, kWh by facility, Emissions by year.
  - Empty state when no data exists with a direct action button to `/upload`.
  - Clean `tCO2e` formatting and thousands separators.
- **Sample Excel Data & Testing**:
  - Sample generator script (`scripts/generate-sample-data.mjs`).
  - Generated files with 20 rows each: `Scope1_FY25.xlsx`, `Scope1_FY26.xlsx`, `Scope2_FY25.xlsx`, `Scope2_FY26.xlsx`.
  - Comprehensive invalid test file `Scope1_wrong_fuel.xlsx` containing illegal fuels (`Coal`, `Wood`, `Gasoline`), blank fuels, typos, and valid fuels with irregular casing/spacing.
  - Automated test script (`scripts/test-excel.ts`) validating parsing, rejection of wrong fuels with multiple errors, and null emission factor preservation.
  - Production build (`next build`) compilation and type checks passing with 0 errors.

---

## PARTIALLY COMPLETE

- **Google Drive Live Connection**:
  - The Google Drive API service-account integration (`lib/drive.ts`) is fully implemented with stream-based uploads, folder hierarchy management, search, and reading/writing JSON and Excel files.
  - Live execution against Google Drive requires providing valid Google Cloud Service Account credentials (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`).

---

## MISSING

- Live Google Cloud credentials and deployment to Vercel (must be supplied by user in `.env.local` or Vercel environment settings).

---

## BROKEN

- None. All previous type errors, script issues, and layout requirements have been resolved and verified via automated test and production build.

---

## NEXT STEPS

1. **Provide Environment Variables**: Populate `.env.local` with `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, and `SESSION_SECRET`.
2. **Local Run**: Execute `npm run dev` to start the development server on `http://localhost:3000`.
3. **Deployment**: Connect repository to Vercel, set the environment variables in the Vercel dashboard, and deploy.
