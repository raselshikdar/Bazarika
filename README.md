# 🛒 Bazarika — Modern E-Commerce Platform

Bazarika is a full-featured, modern e-commerce web application built with **Next.js (App Router)**, **Supabase**, and **Vercel**.  
It supports user authentication, product management, orders, reviews, wishlist, admin dashboard, and secure role-based access control.

🔗 **Live Site:** https://v0-bazarika-2.vercel.app/  
🔗 **Admin Panel:** https://v0-bazarika-2.vercel.app/admin  

---

## ✨ Features

### 👤 User Features
- User authentication (Sign up / Login / Logout)
- Browse products by category
- Product details with:
  - Price & discount
  - Customer reviews & rating summary
- Add to cart & wishlist
- Checkout & place orders
- View order history
- Submit product reviews
- Profile management

---

### ⭐ Reviews & Ratings
- Users can submit product reviews
- Rating summary (average rating + total reviews)
- Review data securely stored and managed with RLS

---

### 🛍️ Cart & Wishlist
- Real-time cart & wishlist count
- Persistent cart per user
- Secure access using Supabase Row Level Security (RLS)

---

### 🛠️ Admin Dashboard
Admin users can:

- Manage products
- Upload product images
- View & manage customer orders
- Update order status (pending, confirmed, shipped, delivered, cancelled)
- View all users (admin-only access)
- Secure admin-only routes

---

## 🔐 Security & Access Control

- Authentication powered by **Supabase Auth**
- Fine-grained **Row Level Security (RLS)** policies
- Role-based access:
  - `customer`
  - `admin`
- Admin actions use **Supabase Service Role (server-side only)**

---

## 🧱 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI**
- **Lucide Icons**

### Backend
- **Supabase**
  - PostgreSQL
  - Auth
  - Storage
  - Row Level Security (RLS)

### Deployment
- **Vercel**
- GitHub integration

---

## 🗄️ Database Highlights

Key tables:
- `products`
- `product_images`
- `categories`
- `orders`
- `order_items`
- `reviews`
- `wishlist`
- `profiles`

All sensitive tables are protected by **RLS policies**.

---

## ⚙️ Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
⚠️ Never expose:
SUPABASE_SERVICE_ROLE_KEY on the client side.

---

## 🚀 Getting Started (Local Development)

```env
# Install dependencies
bun install
# or
npm install

# Run development server
bun run dev
# or
npm run dev
Open http://localhost:3000

---

## 📌 Current Status
✅ Core features stable
✅ Orders & admin management working
✅ Reviews & ratings functional
🛠️ New features planned:
Homepage rating aggregation
Product variants (color, size)
Delivery charge configuration
Multi-image product gallery
Advanced admin user management
