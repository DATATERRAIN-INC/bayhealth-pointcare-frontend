This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

The browser treats a user as signed in only when `access_token` is in `localStorage`. The API validates the JWT. The client does not check the signature.

- Login stores `access_token` and `refresh_token`.
- Private pages (`/patients`, `/calls`, `/settings`) redirect to `/login?redirect=<current path>` when that token is missing. The redirect target must be a relative path, and `/login` is not used as a target.
- If the token is already present, the login page sends the user to the safe `redirect` path or `/dashboard`.
- Authenticated requests send `Authorization: Bearer <access_token>`.
- A 401 response refreshes once with `POST /api/token/refresh/` and `{ "refresh": "<refresh_token>" }`, then retries. If refresh fails, the session is cleared and the user returns to login.
- A 403 response shows a permission message and leaves the session in place.
- Logout removes `access_token`, `refresh_token`, and any SSO keys, sets a short-lived `redirect_logout` flag, resets the API cache, and opens `/login`.
- Clearing `access_token` in another tab signs that tab out on the next check. The next visit to a private page also redirects to login.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
