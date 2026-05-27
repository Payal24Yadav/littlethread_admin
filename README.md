# Admin Dashboard

A sophisticated management interface for administrators to oversee the backend ecosystem. 

## ✨ Key Features
- **Dashboard Analytics**: Visualize sales, orders, and review metrics.
- **Product Management**: Create and update products with detailed descriptions and pricing.
- **Advanced Variants**: Dedicated interface for managing color and size variants.
- **Categorization**: Manage categories and collections to keep the store organized.
- **Review Moderation**: View and manage customer feedback.
- **Theme Support**: Integrated ThemeContext for a consistent aesthetic experience.

## 🛠 Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Networking**: Axios (Base URL configured for the backend API)

## 📂 Project Structure
- `src/pages/`: Main views (Products, Sales, Orders, etc.).
- `src/forms/`: Reusable forms like `ProductForm`.
- `src/context/`: Global state like `ThemeContext`.
- `src/utils/`: API service layer.

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create `admin-dashboard/.env` from the example:
   ```bash
   cp .env.example .env
   ```

   Set `VITE_API_URL` to your backend (include `/api`), for example:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🎨 Design Principles
- **Aesthetic Excellence**: Clean, high-contrast UI with premium spacing.
- **Component-Driven**: Modular structure for rapid scaling and easy maintenance.
- **Responsive**: Fully functional across desktop and tablet interfaces.

## 🔗 Connection
Ensure the `src/utils/api.js` is pointing to the correct backend API URL. By default, it uses values compatible with the `backend-api` module.
