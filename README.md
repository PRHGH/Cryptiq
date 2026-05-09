# Cryptiq

## Abstract

Cryptiq is a Next.js and React cryptocurrency intelligence dashboard that presents market data, candlestick price history, coin search, exchange listings, currency conversion, and sentiment/community indicators from the CoinGecko API. The project addresses the problem of organizing volatile cryptocurrency data into a readable terminal-style interface for browsing, comparison, and individual asset inspection. It uses TypeScript, the Next.js App Router, Tailwind CSS v4, Lightweight Charts, Radix-based UI primitives, SWR, and CoinGecko REST/WebSocket integrations. The implementation demonstrates server/client component separation, typed data modelling, reusable table rendering, debounced search, external API proxying, chart lifecycle management, and design-token-driven interface refinement.

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. System Architecture](#2-system-architecture)
- [3. Development Journey](#3-development-journey)
- [4. Technical Implementation](#4-technical-implementation)
- [5. Technologies & Dependencies](#5-technologies--dependencies)
- [6. Security Considerations](#6-security-considerations)
- [7. Installation & Setup](#7-installation--setup)
- [8. Usage](#8-usage)
- [9. Learning Outcomes](#9-learning-outcomes)
- [10. Challenges & How They Were Solved](#10-challenges--how-they-were-solved)
- [11. Known Limitations & Future Improvements](#11-known-limitations--future-improvements)
- [12. Project Structure](#12-project-structure)
- [13. Potential Interview Questions](#13-potential-interview-questions)
- [14. References & Resources](#14-references--resources)

## 1. Project Overview

Cryptiq is a crypto screener and market terminal. Its public routes are `/`, `/coins`, and `/coins/[id]`, implemented in `app/page.tsx`, `app/coins/page.tsx`, and `app/coins/[id]/page.tsx`. The home page shows a Bitcoin overview chart, a trending-coins table, and top market categories. The coins page lists paginated market data and supports URL-driven search. The coin details page combines the coin header, trend chart, exchange listings, converter, coin details, and sentiment/community statistics.

The project solves a presentation and exploration problem: CoinGecko exposes many market endpoints, but raw JSON responses are not suitable for visual inspection. Cryptiq turns those responses into tables, charts, cards, command-menu search, and formatted financial values. The intended audience is consistent with a portfolio or university project submission: it demonstrates production-oriented frontend engineering practices, but the repository does not include authentication, tests, deployment configuration, or application-level rate limiting.

Key technologies were chosen as follows, based on the codebase:

- **Next.js 16.2.4** is the application framework. The App Router file conventions are used for pages, layout, and route handlers.
- **React 19.2.4** is the UI runtime. Client interactivity is isolated with `"use client"` in files such as `components/SearchModal.tsx`, `components/CandlestickChart.tsx`, and `components/Converter.tsx`.
- **TypeScript 5** provides static typing. Shared global interfaces are declared in `type.d.ts`.
- **Tailwind CSS v4** and CSS variables provide styling. `app/globals.css` contains the dark terminal design system and semantic tokens.
- **CoinGecko API** is the external data provider. `lib/coingecko.actions.ts` centralizes authenticated fetch logic.
- **Lightweight Charts** renders OHLC candlestick charts in `components/CandlestickChart.tsx`.
- **Radix primitives, cmdk, class-variance-authority, and shadcn configuration** provide accessible UI primitives that remain editable in the repository.
- **SWR** supports client-side cached data fetching in the search modal.

The code does not contain alternative implementations such as Axios, Redux, Material UI, or a database layer. Therefore, the architecture is deliberately frontend- and API-consumption-oriented.

## 2. System Architecture

```mermaid
flowchart TD
    Browser[Browser / User]
    Layout[app/layout.tsx<br/>RootLayout + Header + Fonts + Metadata]
    Header[components/Header.tsx<br/>Navigation + SearchModal trigger]
    Home[app/page.tsx<br/>Home dashboard]
    Coins[app/coins/page.tsx<br/>Market list + URL search]
    CoinDetails[app/coins/[id]/page.tsx<br/>Coin detail route]
    SearchAPI[app/api/coins/search/route.ts]
    TrendingAPI[app/api/coins/trending/route.ts]
    Fetcher[lib/coingecko.actions.ts<br/>fetcher/searchCoins/getTrendingCoins]
    Utils[lib/utils.ts<br/>formatters + helpers]
    CoinGecko[CoinGecko REST API]
    WebSocket[CoinGecko WebSocket API]
    Chart[components/CandlestickChart.tsx<br/>Lightweight Charts]
    Hook[hooks/useCoinGeckoWebsocket.ts]
    CSS[app/globals.css<br/>Tailwind + semantic tokens]

    Browser --> Layout
    Layout --> Header
    Layout --> Home
    Layout --> Coins
    Layout --> CoinDetails
    Header --> SearchAPI
    Header --> TrendingAPI
    SearchAPI --> Fetcher
    TrendingAPI --> Fetcher
    Home --> Fetcher
    Coins --> Fetcher
    CoinDetails --> Fetcher
    Fetcher --> CoinGecko
    CoinDetails --> Chart
    Home --> Chart
    Chart --> Fetcher
    Hook --> WebSocket
    Home --> Utils
    Coins --> Utils
    CoinDetails --> Utils
    Layout --> CSS
```

The system follows a layered architecture:

- **Route layer:** Files in `app/` define public pages and API handlers. `app/layout.tsx` wraps all pages with fonts, metadata, favicon, global styles, and `Header`.
- **Server data layer:** `lib/coingecko.actions.ts` is marked `"use server"` and contains `fetcher<T>()`, `searchCoins()`, `getTrendingCoins()`, and `getPools()`.
- **Client interaction layer:** Components with `"use client"` manage local state, keyboard shortcuts, debounced input, chart lifecycle, select controls, pagination, and WebSocket state.
- **Presentation layer:** Reusable components such as `DataTable`, `CoinHeader`, `Converter`, and `CoinCommunitySentimentCard` render domain-specific UI.
- **Design layer:** `app/globals.css` defines tokens, layout classes, component classes, scrollbars, skeleton animation, live indicator animation, and chart/card visual hierarchy.

Request/data flow:

1. A user opens `/`. `app/page.tsx` renders `CoinOverview`, `TrendingCoins`, and `Categories` inside React `Suspense` boundaries.
2. Server components call `fetcher<T>()`, which builds a CoinGecko URL with `query-string`, selects `x-cg-pro-api-key` or `x-cg-demo-api-key`, and sends a typed `fetch` request with Next.js `revalidate`.
3. The response is transformed by components into charts and tables. `DataTable` receives typed column definitions and row data.
4. A user opens the search modal from `Header`. `SearchModal` uses `useKey` for `Ctrl/Cmd + K`, `useDebounce` for search timing, and `useSWR` for client-side requests to `/api/coins/search` or `/api/coins/trending`.
5. The API route handlers import server-only CoinGecko functions and return JSON to the client, preventing the client component from importing the server module directly.
6. A user opens `/coins/[id]`. The details page concurrently fetches `/coins/{id}`, `/coins/{id}/ohlc`, and `/coins/{id}/tickers`, then renders the header, chart, exchange table, converter, metadata cards, and sentiment/community card.
7. `CandlestickChart` creates a Lightweight Charts instance on the client, observes container resizing with `ResizeObserver`, and re-fetches OHLC data when the user changes the period.

The dominant pattern is a **layered server/client architecture** rather than MVC. Server components and route handlers handle external data access; client components handle browser-only behavior; shared utilities handle formatting and class merging.

## 3. Development Journey

The chronological history below is based on `git log --oneline --all`.

1. **Initial scaffold:** `4479ed0 Initial commit from Create Next App` created the baseline Next.js project. The original `README.md` was the default create-next-app README.
2. **Navigation foundation:** `96e842d implement navigation` and `dc8872f fix coderabbit suggestions` introduced navigation structure. The current `Header` shows the Cryptiq brand, Home link, Search trigger, All Coins link, and a live status pill.
3. **Home dashboard data:** `d4255e7 implement coin overview and ttrending coins ui and functionality using the fethcer utility function` added home-page data presentation around CoinGecko fetch logic. Current files `components/home/CoinOverview.tsx` and `components/home/TrendingCoins.tsx` reflect this milestone.
4. **Candlestick chart:** `ea40da9 implement candlestick-chart`, `c9de985 implement fixes suggested by codeRabbit`, and `b62c8db fixed chart theme to match the application` introduced and refined `CandlestickChart`. The chart uses `lightweight-charts`, period buttons, and theme configuration from `constants.ts`.
5. **Categories and coins page:** `ab1d6bc implement categories and all coins page` added market categories and the `/coins` table. `dace241 fix issues shown by CodeRabbit` and `7dc49fd fix pagination button theme` refined pagination and review issues.
6. **Coin details:** `cb6a335 implement several components of coin-details page`, `96df6c1 adjustments in the fonts`, and `4623a2f implement exchange listings table and sentiment & community section` expanded `/coins/[id]` with `CoinHeader`, `Converter`, exchange listings, and `CoinCommunitySentimentCard`.
7. **UI improvement:** `a4bd0d3 major upate in the ui`, `f5f8a97 fixed ui issues`, and `a215ed5 fix codeRabbit suggestions` rebranded the interface toward the current dark terminal visual system in `app/globals.css`.
8. **Search modal and production cleanup:** `4f3ba05 Implement the search modal and polish cryptiq ui and cleanup production code` added the command-dialog search flow and broader cleanup. `fce7324 Fix review findings for Cryptiq cleanup` and `33585ef Refine search modal and harden coin API routes` refined semantic tokens, API route boundaries, and UI alignment.
9. **Review hardening:** `b84db30 fixed potential issues pointed by codeRabbit` added further defensive behavior. The current `useCoinGeckoWebsocket.ts` safely parses WebSocket messages and checks `WebSocket.OPEN` before sending.

The design direction changed from the create-next-app baseline to a branded “Cryptiq” terminal. This is visible in `app/layout.tsx` metadata, `Header`, `public/logo.svg`, `public/favicon.svg`, and the semantic color tokens in `app/globals.css`.

## 4. Technical Implementation

### `app/layout.tsx`

`RootLayout` imports Inter, IBM Plex Mono, and Space Mono with `next/font/google`, exposing each as a CSS variable. It sets global metadata with title `Cryptiq`, description, and `/favicon.svg?v=cryptiq-round-2`. It adds the `dark` class to `<html>` and renders `Header` above every page. This follows the App Router root layout convention and centralizes shared UI and font setup.

### `app/page.tsx`

The home page is a server component that composes three async data sections: `CoinOverview`, `TrendingCoins`, and `Categories`. Each section is wrapped in `Suspense` with a fallback from `components/home/fallback.tsx`. This keeps loading behavior local to each section rather than blocking the whole page on one request.

### `app/coins/page.tsx`

The coins page reads `searchParams` as a promise, matching the Next.js 16 App Router convention. It validates `page`, derives `currentPage`, and switches between two data modes:

- Market mode calls `/coins/markets` with `per_page: 10`, market-cap order, USD currency, and 24h change data.
- Search mode calls `searchCoins(query)` and renders search-specific columns.

The page uses column configuration arrays for `DataTable`, which separates table structure from table rendering. Pagination is omitted during search mode because `/search` results are not paginated by this component.

### `app/coins/[id]/page.tsx`

The coin detail page reads `params`, then uses `Promise.all` to request:

- `/coins/{id}` for metadata, market data, sentiment, community data, and links.
- `/coins/{id}/ohlc` for initial chart data.
- `/coins/{id}/tickers` for exchange listings.

It constructs `coinDetails` and `exchangeListingColumns` locally, then renders primary content and secondary panels. External trade, homepage, explorer, and community links use `target="_blank"` with `rel="noopener noreferrer"`.

### API route handlers

`app/api/coins/search/route.ts` exposes `GET /api/coins/search?q=bitcoin`. It trims the query, returns `[]` when the query is absent, calls `searchCoins(query)` inside `try/catch`, logs upstream failures, and returns HTTP `502` with a stable JSON error payload on failure.

`app/api/coins/trending/route.ts` exposes `GET /api/coins/trending?limit=5`. It parses `limit` as an integer, defaults invalid or non-positive values to `5`, clamps the range to `1..100`, and calls `getTrendingCoins(clampedLimit)`. It returns HTTP `502` when fetching trending coins fails.

These handlers create a server boundary for client-side search. `SearchModal` calls these app routes instead of importing the server-only CoinGecko module.

### `lib/coingecko.actions.ts`

This server module centralizes CoinGecko REST access. `fetcher<T>()`:

- Normalizes leading slashes in endpoints.
- Converts Demo API OHLC requests by removing `interval` and converting `days: "max"` to `365`.
- Builds URLs with `query-string.stringifyUrl`.
- Selects `x-cg-pro-api-key` when `COINGECKO_BASE_URL` includes `pro-api.coingecko.com`; otherwise it uses `x-cg-demo-api-key`.
- Adds `next: { revalidate }` for Next.js data caching.
- Throws an error containing response status and upstream message when the response is not OK.

`searchCoins()` and `getTrendingCoins()` are domain wrappers around `/search` and `/search/trending`. `getPools()` provides a fallback `PoolData` object and catches failures in the generic pool search branch.

### `lib/utils.ts`

This file contains reusable non-UI logic:

- `cn()` merges `clsx` and `tailwind-merge`.
- `formatCurrency()` formats numeric values as localized currency or number strings.
- `formatPercentage()` formats numeric percentage values with one decimal place.
- `getTrendDirection()` converts a number into `"up"`, `"down"`, or `"neutral"` after rounding.
- `formatCompactNumber()` converts large community metrics to `K` and `M`.
- `trendingClasses()` maps trend direction to text, background, and icon class names.
- `timeAgo()` converts timestamps into short relative strings.
- `convertOHLCData()` maps raw OHLC arrays into Lightweight Charts data and removes duplicate time values.
- `buildPageNumbers()` builds pagination items with an `ELLIPSIS` sentinel.

The design principle is single responsibility: formatting, class merging, chart conversion, and pagination calculation are kept out of rendering components.

### `constants.ts`

`constants.ts` contains navigation labels, chart colors, chart configuration factories, period-to-OHLC query mappings, period button labels, and live interval labels. `getChartConfig()` and `getCandlestickConfig()` isolate chart configuration from the component lifecycle. This avoids duplicating chart styling logic across home and coin detail pages.

### `hooks/useCoinGeckoWebsocket.ts`

This client hook connects to `NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL` with `NEXT_PUBLIC_COINGECKO_API_KEY`. It maintains WebSocket readiness, latest price, recent trades, and latest OHLC candle state. It handles `ping` messages by sending `pong`, tracks confirmed subscriptions, parses price (`C1`), trade (`G2`), and OHLC (`G3`) messages, and logs malformed WebSocket messages rather than crashing the handler.

The hook keeps a `subscribed` set to avoid duplicate subscriptions. On dependency changes it unsubscribes previous channels, resets state, subscribes to `CGSimplePrice`, and conditionally subscribes to `OnchainTrade` and `OnchainOHLCV` after converting pool IDs with `replaceAll("_", ":")`. Although implemented, the current page files do not import this hook, so it is prepared infrastructure rather than active UI flow.

### `components/Header.tsx`

`Header` is a client component because it reads `usePathname()`. It renders the logo, brand text, live pill, route links, and `SearchModal`. Active navigation styling is calculated with `cn()`.

### `components/SearchModal.tsx`

`SearchModal` implements a command-dialog search experience. It uses:

- `useKey` from `react-use` to toggle the modal with `Ctrl/Cmd + K`.
- `useDebounce` to separate immediate input state from the search trigger.
- `useSWR` to fetch trending coins when idle and search results when a debounced query exists.
- `router.push()` to navigate to `/coins/{coin.id}` on selection.

Rows are rendered by `SearchCoinRow`, which handles both trending and search variants. Trending rows show price and 24h change; search rows show rank and CoinGecko ID. Styling is applied through `.search-modal-surface` in `app/globals.css` because the dialog renders in a portal.

### `components/CoinsSearchInput.tsx`

This client component supports `/coins` page search. It stores local input state, syncs with `initialQuery`, debounces updates by 350ms, edits `URLSearchParams`, removes `page` when searching, and calls `router.replace()` only when the computed URL changes. This keeps the search query shareable through the URL.

### `components/CandlestickChart.tsx`

`CandlestickChart` is client-only because Lightweight Charts requires browser APIs. It stores the selected period, OHLC data, chart instance, and series instance. It creates a chart in `useEffect`, observes container resizing with `ResizeObserver`, removes the chart on cleanup, and converts millisecond timestamps to seconds before passing data into Lightweight Charts.

The tradeoff is that period changes fetch OHLC data from a client component by calling the server action module. This currently works in the project, but a stricter boundary would proxy chart period requests through an API route, as the search modal does.

### `components/DataTable.tsx`

`DataTable<T>` is a generic table abstraction. It receives typed columns, data, row key logic, and optional class overrides. It delegates semantic table primitives to `components/ui/table.tsx` and allows each feature page to own its column definitions. This follows DRY without hiding domain-specific column logic.

### `components/CoinsPagination.tsx`

`CoinsPagination` is a client component that renders previous/next controls and page links. It uses `buildPageNumbers()` to avoid displaying every possible page. It navigates with `router.push("/coins?page={page}")`.

### `components/CoinHeader.tsx`

`CoinHeader` displays the selected coin’s name, image, current price, 24h badge, and three stat entries. It uses `getTrendDirection()` to apply positive, negative, or neutral color classes. Percentage fields use `formatPercentage()`; absolute 24h price movement uses `formatCurrency()`.

### `components/CoinCommunitySentimentCard.tsx`

This component formats CoinGecko sentiment and community fields safely. Missing or non-finite values produce `N/A`. Community values use `formatCompactNumber()` and suffixes such as `subscribers`, `users`, `followers`, and `likes`.

### `components/Converter.tsx`

`Converter` is a client component that multiplies a local `amount` by the selected currency value from `priceList`. It uses the local `Input` primitive and Radix-based `Select` primitives. It formats output with `formatCurrency(convertedPrice, 2, currency, false)`.

### Home components

`CoinOverview` fetches Bitcoin detail and OHLC data, catches errors, and falls back to `CoinOverviewFallback`. `TrendingCoins` fetches `/search/trending`, slices the first six results, and renders a table. `Categories` fetches `/coins/categories` and renders the first ten categories with market cap, volume, and top coin images. `fallback.tsx` contains skeleton rows for loading states.

### UI primitives

Files in `components/ui/` define local primitives:

- `button.tsx` and `badge.tsx` use `class-variance-authority` for variants.
- `dialog.tsx`, `select.tsx`, and `separator.tsx` wrap Radix primitives.
- `command.tsx` wraps `cmdk` and composes it with `Dialog`.
- `input.tsx`, `input-group.tsx`, `table.tsx`, and `pagination.tsx` provide base building blocks.

These files follow the shadcn-style local ownership model: the project owns the source and customizes it directly.

### Styling system

`app/globals.css` imports Tailwind, `tw-animate-css`, and shadcn Tailwind styles. It defines semantic tokens such as `--crypto-bg-primary`, `--crypto-bg-card`, `--positive`, `--negative`, `--brand-accent`, `--color-surface`, `--color-text-secondary`, and `--shadow-card`. Component-specific selectors style the header, chart, home cards, coin detail page, exchange table, coin list, search modal, converter, sentiment card, pagination, and skeletons.

## 5. Technologies & Dependencies

### Runtime and framework

- **Node.js / npm:** The current local environment used for validation is Node `v22.19.0` and npm `11.9.0`. `package.json` does not define an `engines` field.
- **Next.js 16.2.4:** Provides App Router routing, server components, route handlers, image optimization, metadata, font loading, and Turbopack build configuration.
- **React 19.2.4 and React DOM 19.2.4:** Provide component rendering, hooks, client components, state, effects, and transitions.
- **TypeScript 5:** Enforces strict typing through `tsconfig.json` with `strict: true`, `moduleResolution: "bundler"`, and path alias `@/*`.

### Data and networking

- **CoinGecko API:** Supplies coin markets, search, trending coins, coin details, OHLC data, tickers, categories, and optional WebSocket streams.
- **query-string:** Builds encoded CoinGecko REST URLs in `fetcher<T>()`.
- **SWR:** Fetches and caches modal search/trending results from internal API routes.
- **WebSocket API:** Used in `useCoinGeckoWebsocket.ts` for live price/trade/OHLC infrastructure.

### UI and styling

- **Tailwind CSS v4:** Provides utility classes and the `@theme inline` token bridge in `app/globals.css`.
- **PostCSS with `@tailwindcss/postcss`:** Integrates Tailwind into the CSS build pipeline.
- **tw-animate-css:** Supplies animation utilities imported globally.
- **Radix UI:** Provides accessible primitives for dialog, select, separator, and slot composition.
- **cmdk:** Provides command-menu primitives for the search modal.
- **class-variance-authority:** Defines typed button and badge variants.
- **clsx and tailwind-merge:** Combine conditional classes and resolve Tailwind conflicts through `cn()`.
- **Phosphor Icons and Lucide React:** Provide interface icons. Phosphor is used in local UI primitives; Lucide is used for trend and external-link icons.
- **Lightweight Charts:** Renders financial candlestick charts.
- **next/image and next/font:** Optimize remote CoinGecko images and load Inter, IBM Plex Mono, and Space Mono.

### Tooling

- **ESLint 9 with `eslint-config-next`:** Lints JavaScript/TypeScript/React code.
- **Prettier 3.8.3 and `eslint-config-prettier`:** Formats code and disables conflicting lint rules.
- **shadcn CLI/config:** `components.json` declares aliases, Tailwind CSS path, Radix Lyra style, and Phosphor icon library.

## 6. Security Considerations

- **API key placement:** `lib/coingecko.actions.ts` reads `COINGECKO_API_KEY` first and falls back to `NEXT_PUBLIC_COINGECKO_API_KEY`. Server routes can use the private key. The WebSocket hook uses public variables because it runs in the browser. Limitation: any `NEXT_PUBLIC_*` key is visible to clients.
- **Header selection:** `API_KEY_HEADER` selects `x-cg-pro-api-key` or `x-cg-demo-api-key` based on the configured base URL. This prevents sending the wrong CoinGecko header for Demo versus Pro endpoints.
- **Environment validation:** The server module throws if `COINGECKO_BASE_URL` or an API key is missing. This causes configuration errors to fail early.
- **Internal API boundaries:** `SearchModal` calls `/api/coins/search` and `/api/coins/trending` instead of importing the server-only CoinGecko module. This reduces the risk of bundling server environment logic into a client component.
- **Input normalization:** Search queries are trimmed; empty search returns `[]`. Trending `limit` is parsed as an integer and clamped to `1..100`.
- **Upstream failure handling:** Search and trending API handlers return stable JSON error responses with status `502` when CoinGecko requests fail.
- **External links:** Coin detail links and trade URLs use `rel="noopener noreferrer"` with `target="_blank"` to mitigate tabnabbing.
- **Image allowlist:** `next.config.ts` permits optimized remote images only from `assets.coingecko.com` and `coin-images.coingecko.com`.
- **WebSocket defensive parsing:** The WebSocket hook catches malformed JSON, validates subscription identifiers, checks socket readiness before sending, and logs failures.
- **Known limitations:** There is no authentication, CSRF protection, rate limiter, request timeout wrapper, schema validation library, CSP header configuration, or automated security test suite. The search API exposes upstream query capability without per-client throttling.

## 7. Installation & Setup

### Prerequisites

- Node.js: validated locally with `v22.19.0`.
- npm: validated locally with `11.9.0`.
- CoinGecko API credentials.

`package.json` does not specify an `engines` field. Use a modern Node.js version compatible with Next.js 16 and ESLint 9.

### Environment Variables

Create `.env.local` with the following keys:

```env
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your_server_side_key
NEXT_PUBLIC_COINGECKO_API_KEY=your_public_or_demo_key
NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL=your_websocket_url
```

Observed usage:

- `COINGECKO_BASE_URL`: Base URL for REST requests in `fetcher<T>()`.
- `COINGECKO_API_KEY`: Preferred server-side API key.
- `NEXT_PUBLIC_COINGECKO_API_KEY`: Fallback REST key and browser WebSocket key.
- `NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL`: Browser WebSocket endpoint used by `useCoinGeckoWebSocket`.

### Commands

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Build and production run:

```bash
npm run build
npm run start
```

Quality checks:

```bash
npm run lint
npx tsc --noEmit
npm run format:check
```

### Verification

The following commands were run successfully during documentation preparation:

```bash
npm run lint
npx tsc --noEmit
```

Functional verification:

- `/` should show Bitcoin overview, trending coins, and top categories.
- `/coins` should show the market list and pagination.
- `/coins?q=bitcoin` should show search results.
- `/coins/bitcoin` should show detail data, chart, exchange listings, converter, and sentiment/community sections.
- `/api/coins/search?q=bitcoin` should return a JSON array.
- `/api/coins/trending?limit=5` should return a JSON array.

## 8. Usage

### Application routes

#### `GET /`

Entry point implemented by `app/page.tsx`.

Expected UI state:

- Coin overview chart for Bitcoin.
- Trending coins table.
- Top categories table.
- Skeleton fallbacks while sections load.

#### `GET /coins`

Entry point implemented by `app/coins/page.tsx`.

Example:

```text
/coins?page=2
```

Expected UI state:

- Heading `All Coins`.
- Search input.
- Table columns: Rank, Token, Price, 24h Change, Market Cap.
- Pagination controls.

#### `GET /coins?q={query}`

Search mode in `app/coins/page.tsx`.

Example:

```text
/coins?q=ethereum
```

Expected UI state:

- Heading `Search Results for "ethereum"`.
- Table columns: Rank, Token, Symbol, Coin ID.
- No pagination.

#### `GET /coins/{id}`

Coin details route implemented by `app/coins/[id]/page.tsx`.

Example:

```text
/coins/bitcoin
```

Expected UI state:

- Coin header and price.
- Trend Overview chart.
- Exchange Listings table.
- Converter.
- Coin Details cards.
- Sentiment & Community card.

### Internal API routes

#### `GET /api/coins/search?q={query}`

Implemented by `app/api/coins/search/route.ts`.

Example:

```bash
curl "http://localhost:3000/api/coins/search?q=bitcoin"
```

Possible responses:

- `200 OK` with `[]` when `q` is missing or empty.
- `200 OK` with an array of `SearchCoin` objects on success.
- `502 Bad Gateway` with `{ "error": "Unable to search coins right now. Please try again shortly." }` on upstream failure.

#### `GET /api/coins/trending?limit={number}`

Implemented by `app/api/coins/trending/route.ts`.

Example:

```bash
curl "http://localhost:3000/api/coins/trending?limit=5"
```

Behavior:

- Missing `limit` defaults to `5`.
- Non-positive or invalid `limit` defaults to `5`.
- Valid values are clamped between `1` and `100`.

Possible responses:

- `200 OK` with an array of trending coin items.
- `502 Bad Gateway` with `{ "error": "Failed to fetch trending coins" }` on upstream failure.

### UI commands

- Header Search button opens the command dialog.
- `Ctrl + K` or `Cmd + K` toggles the search dialog.
- Empty modal input shows trending coins.
- Typing a query triggers debounced search after 350ms.
- Selecting a row navigates to `/coins/{id}`.

### npm scripts

- `npm run dev`: starts the Next.js development server.
- `npm run build`: creates an optimized production build.
- `npm run start`: starts the production server after a build.
- `npm run lint`: runs ESLint.
- `npm run lint:fix`: runs ESLint with automatic fixes.
- `npm run format`: formats the repository with Prettier.
- `npm run format:check`: checks formatting.

## 9. Learning Outcomes

### Programming language concepts and features used

- **TypeScript generics:** `fetcher<T>()` and `DataTable<T>` apply type parameters to reusable infrastructure.
- **Union and literal types:** `Period` and `ELLIPSIS` model controlled option sets.
- **Optional chaining and nullish fallback:** Used in community stats, search data, and API responses to avoid crashes on missing fields.
- **Async/await:** Used in server components, route handlers, and CoinGecko data functions.
- **React hooks:** `useState`, `useEffect`, `useRef`, `useTransition`, `useRouter`, `usePathname`, and `useSearchParams` manage client state and navigation.

### Software engineering principles practiced

- **Single Responsibility Principle:** Formatting logic is in `lib/utils.ts`; data fetching is in `lib/coingecko.actions.ts`; rendering is in components.
- **DRY:** `DataTable<T>` avoids repeated table scaffolding.
- **Separation of concerns:** API routes separate browser search from server-only CoinGecko access.
- **Progressive enhancement:** Suspense fallbacks provide useful intermediate UI states.
- **Defensive programming:** API handlers and WebSocket parsing handle malformed or failed inputs.

### Security concepts applied

- **Secret management:** Private and public environment variables are separated by naming and usage context.
- **External link safety:** `rel="noopener noreferrer"` is applied to external links opened in new tabs.
- **Remote image allowlisting:** `next.config.ts` restricts optimized image hosts.
- **Input clamping:** Trending route limits are constrained.
- **Error containment:** API route failures return stable JSON instead of leaking raw upstream responses.

### Infrastructure and deployment knowledge gained

- **Next.js build pipeline:** `next.config.ts`, Turbopack root configuration, `next/font`, and App Router conventions are used.
- **PostCSS/Tailwind pipeline:** `postcss.config.mjs` integrates Tailwind v4.
- **Static and dynamic routes:** The project contains static pages, dynamic pages, and dynamic API routes.
- **Environment-based configuration:** CoinGecko access depends on `.env.local`.

### Design patterns implemented and understood

- **Layered architecture:** Route, data, client interaction, presentation, and design-token layers are distinct.
- **Adapter/wrapper pattern:** UI primitives wrap Radix and cmdk primitives with project-specific styling.
- **Configuration factory:** `getChartConfig()` and `getCandlestickConfig()` produce chart options.
- **Render-by-configuration:** `DataTable` renders columns described by arrays of column definitions.
- **Proxy route pattern:** Search and trending route handlers mediate client requests to server-side data functions.

### New tools or technologies learned

- **Lightweight Charts:** Creating, resizing, and destroying chart instances in React.
- **SWR:** Client-side key-based fetching and conditional request pausing with `null`.
- **cmdk:** Command menu composition and selected item state.
- **Radix primitives:** Accessible dialog/select foundations.
- **Tailwind v4 theme variables:** Semantic tokens through `@theme inline`.

## 10. Challenges & How They Were Solved

### Server/client boundary in search

- **Problem:** A client component initially needed CoinGecko search/trending data.
- **Why it occurred:** `SearchModal` is client-side because it uses keyboard shortcuts, local state, and router navigation, while `coingecko.actions.ts` is server-only.
- **Diagnosis:** Importing server-only functions into a client component risks bundling server environment logic.
- **Solution:** Added `app/api/coins/search/route.ts` and `app/api/coins/trending/route.ts`, then changed `SearchModal` to call those routes through SWR.
- **Learning:** Client interactivity should communicate with server-only data access through explicit server boundaries.

### Search modal alignment

- **Problem:** Search modal rows had alignment issues, especially in the right-side metric column.
- **Why it occurred:** Dialog content renders in a portal, so styles nested only under `#search-modal` did not fully apply to modal content.
- **Diagnosis:** The visible UI showed labels and values collapsing together; CSS inspection showed portal-level styling was needed.
- **Solution:** Added row layout rules under `.search-modal-surface`, including fixed metric columns and internal metric grids.
- **Learning:** Portal-rendered components often require styling at the portal content class, not only at the trigger’s ancestor.

### OHLC API differences

- **Problem:** CoinGecko Demo API OHLC parameters differ from the application’s period configuration.
- **Why it occurred:** `PERIOD_CONFIG` includes `interval`, but Demo OHLC requests do not use the same interval parameter.
- **Diagnosis:** `normalizeDemoOHLCParams()` exists specifically for endpoints ending in `/ohlc` when not using Pro API.
- **Solution:** The fetcher removes `interval` and maps `days: "max"` to `365` for Demo OHLC requests.
- **Learning:** Third-party API plans can require request normalization in a centralized adapter.

### Missing or partial upstream data

- **Problem:** Community counts, sentiment values, search result fields, and trending arrays may be missing or null.
- **Why it occurred:** External API responses are not controlled by the UI.
- **Diagnosis:** The code uses optional chaining and fallback checks in `CoinCommunitySentimentCard`, `SearchModal`, and `getTrendingCoins`.
- **Solution:** Missing community values render as `N/A`; missing trending arrays default to `[]`; missing trend direction becomes neutral.
- **Learning:** External data presentation should be tolerant of partial responses.

### WebSocket message safety

- **Problem:** WebSocket messages and subscription confirmations could contain invalid JSON or malformed identifiers.
- **Why it occurred:** Live streams are external event sources, and not every event shape can be trusted.
- **Diagnosis:** The hook now checks `typeof event.data`, wraps JSON parsing in `try/catch`, and validates `channel`.
- **Solution:** Malformed messages are logged and ignored; sends check `WebSocket.OPEN`.
- **Learning:** Event-stream code needs defensive parsing and state guards.

### Zero percentage coloring

- **Problem:** Rounded `0.0%` values could appear positive or negative.
- **Why it occurred:** Simple greater-than checks do not account for rounded display values.
- **Diagnosis:** `getTrendDirection()` rounds before classifying.
- **Solution:** Neutral styling is applied when the rounded value is zero.
- **Learning:** Visual classification should match displayed formatting.

## 11. Known Limitations & Future Improvements

- **No automated tests:** The project has linting and type checking but no unit, integration, or end-to-end tests.
- **No error boundaries:** Server component failures are handled in some home components, but route-level `error.tsx` files are not present.
- **No application rate limiting:** Internal API routes do not throttle clients.
- **No request timeout wrapper:** `fetcher<T>()` relies on the platform fetch behavior and does not use `AbortController`.
- **No schema validation:** API responses are typed at compile time but not validated at runtime.
- **WebSocket hook not currently rendered:** `useCoinGeckoWebSocket` exists but is not imported by current pages.
- **Client chart period fetch boundary:** `CandlestickChart` imports `fetcher` directly; a route handler could make the boundary match the search implementation.
- **Limited accessibility audit:** Radix/cmdk primitives help, but there is no automated accessibility test.
- **No deployment config:** There is no Vercel project config or CI workflow in the repository.
- **No persistent user features:** There are no watchlists, portfolios, accounts, or saved preferences.

Potential future features:

- Add test coverage for formatters, API routes, pagination, and search behavior.
- Add route-level loading and error files.
- Add a rate limiter for `/api/coins/search` and `/api/coins/trending`.
- Add runtime validation with a schema library.
- Integrate `useCoinGeckoWebSocket` into the coin detail page for live price/trade updates.
- Add user watchlists backed by a database.
- Add CI to run lint, typecheck, build, and tests on pull requests.

## 12. Project Structure

```text
.
├── .env.local                         # Local environment variables; ignored by Git.
├── .gitignore                         # Git ignore rules for dependencies, builds, env files, and generated types.
├── .prettierignore                    # Files excluded from Prettier.
├── .prettierrc                        # Prettier formatting options.
├── AGENTS.md                          # Local agent instruction document.
├── CLAUDE.md                          # Tooling note pointing to AGENTS.md.
├── README.md                          # Project documentation.
├── components.json                    # shadcn configuration, aliases, Tailwind path, and icon library.
├── constants.ts                       # Navigation items, chart colors, chart config factories, and period mappings.
├── eslint.config.mjs                  # ESLint flat config using Next core-web-vitals, TypeScript, and Prettier config.
├── next-env.d.ts                      # Generated Next.js TypeScript references.
├── next.config.ts                     # Next config with Turbopack root and remote image host allowlist.
├── package-lock.json                  # npm dependency lockfile.
├── package.json                       # Project scripts, runtime dependencies, and dev dependencies.
├── postcss.config.mjs                 # PostCSS config for Tailwind CSS.
├── tsconfig.json                      # TypeScript compiler configuration and path alias.
├── tsconfig.tsbuildinfo               # TypeScript incremental build cache.
├── type.d.ts                          # Global project interfaces and type aliases.
├── app
│   ├── globals.css                    # Global Tailwind imports, design tokens, component styles, and animations.
│   ├── layout.tsx                     # Root layout with metadata, fonts, Header, and global CSS.
│   ├── page.tsx                       # Home dashboard route.
│   ├── api
│   │   └── coins
│   │       ├── search
│   │       │   └── route.ts           # GET /api/coins/search handler.
│   │       └── trending
│   │           └── route.ts           # GET /api/coins/trending handler.
│   └── coins
│       ├── page.tsx                   # /coins list and search route.
│       └── [id]
│           └── page.tsx               # /coins/{id} detail route.
├── components
│   ├── CandlestickChart.tsx           # Client candlestick chart wrapper around Lightweight Charts.
│   ├── CoinCommunitySentimentCard.tsx # Sentiment and community statistics panel.
│   ├── CoinHeader.tsx                 # Coin detail price header.
│   ├── CoinsPagination.tsx            # Client pagination controls for /coins.
│   ├── CoinsSearchInput.tsx           # Debounced URL-synced search input for /coins.
│   ├── Converter.tsx                  # Coin-to-currency converter.
│   ├── DataTable.tsx                  # Generic typed table renderer.
│   ├── Header.tsx                     # Global navigation and search trigger.
│   ├── SearchModal.tsx                # Command-dialog search modal.
│   ├── home
│   │   ├── Categories.tsx             # Top categories table.
│   │   ├── CoinOverview.tsx           # Bitcoin overview chart card.
│   │   ├── TrendingCoins.tsx          # Trending coins table.
│   │   └── fallback.tsx               # Skeleton fallback components.
│   └── ui
│       ├── badge.tsx                  # Badge primitive with variants.
│       ├── button.tsx                 # Button primitive with variants.
│       ├── command.tsx                # cmdk command primitives composed with Dialog.
│       ├── dialog.tsx                 # Radix dialog wrapper.
│       ├── input-group.tsx            # Compound input group primitives.
│       ├── input.tsx                  # Input primitive.
│       ├── pagination.tsx             # Pagination primitives.
│       ├── select.tsx                 # Radix select wrapper.
│       ├── separator.tsx              # Radix separator wrapper.
│       └── table.tsx                  # Table primitives.
├── hooks
│   └── useCoinGeckoWebsocket.ts       # Client WebSocket hook for live CoinGecko streams.
├── lib
│   ├── coingecko.actions.ts           # Server-side CoinGecko fetcher and domain helpers.
│   └── utils.ts                       # Class merging, formatting, trend, OHLC, and pagination helpers.
└── public
    ├── converter.svg                  # Converter icon used by Converter.
    ├── favicon.svg                    # Browser favicon.
    └── logo.svg                       # Cryptiq logo used in Header.
```

## 13. References & Resources

- Next.js Documentation: https://nextjs.org/docs
- Next.js App Router `page` file convention: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- Next.js App Router `layout` file convention: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- Next.js App Router `route` file convention: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
- React Documentation: https://react.dev/
- React TypeScript guide: https://react.dev/learn/typescript
- TypeScript Documentation: https://www.typescriptlang.org/docs/
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Tailwind CSS PostCSS integration: https://tailwindcss.com/docs/installation/using-postcss
- PostCSS Documentation: https://postcss.org/docs/
- CoinGecko API Documentation: https://docs.coingecko.com/
- CoinGecko API overview: https://www.coingecko.com/en/api
- Lightweight Charts Documentation: https://tradingview.github.io/lightweight-charts/docs
- Lightweight Charts product page: https://www.tradingview.com/lightweight-charts/
- SWR Documentation: https://swr.vercel.app/docs/getting-started
- Radix Primitives Documentation: https://www.radix-ui.com/primitives/docs/overview/introduction
- cmdk package documentation: https://www.npmjs.com/package/cmdk
- shadcn CLI Documentation: https://ui.shadcn.com/docs/cli
- class-variance-authority Documentation: https://www.npmjs.com/package/class-variance-authority
- clsx package: https://www.npmjs.com/package/clsx
- tailwind-merge package: https://www.npmjs.com/package/tailwind-merge
- query-string package: https://www.npmjs.com/package/query-string
- react-use package: https://www.npmjs.com/package/react-use
- Phosphor Icons React: https://github.com/phosphor-icons/react
- Lucide React Documentation: https://lucide.dev/guide/packages/lucide-react
- ESLint Documentation: https://eslint.org/docs/latest/
- Prettier Documentation: https://prettier.io/docs/
- MDN WebSocket API: https://developer.mozilla.org/docs/Web/API/WebSocket
- MDN Fetch API: https://developer.mozilla.org/docs/Web/API/Fetch_API
- MDN URLSearchParams: https://developer.mozilla.org/docs/Web/API/URLSearchParams
