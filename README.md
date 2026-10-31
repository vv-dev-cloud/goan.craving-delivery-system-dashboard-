# Goan Craving Delivery Dashboard

Delivery staff dashboard built with Node.js, Express, EJS, MongoDB/Mongoose, JavaScript, and CSS.

## Setup

1. Install Node.js 20+ and MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `SESSION_SECRET`.
4. Create delivery staff accounts through a trusted admin/employee workflow; this scaffold does not expose public signup.
5. Run `npm run dev`.

Delivery reports are separate from the official order status. Only an authorized employee can verify a report and finalize an order as delivered.

## Features

- Delivery staff login and role-protected routes
- Assigned orders and dashboard metrics
- Accept/reject assignment and pickup/out-for-delivery progress
- Submit delivery result for employee verification
- Delivery history and responsive EJS/CSS interface

The app expects order documents in the configured MongoDB database. Adapt the Order model to match the central Goan Craving order schema when integrating.
