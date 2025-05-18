# BigDeal E-commerce Admin Panel

A modern and beautiful admin panel for BigDeal E-commerce platform, built with Next.js and Tailwind CSS.

![Admin Panel Screenshot](https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=BigDeal+Admin+Panel)

## Features

- 📊 Dashboard with key metrics and statistics
- 🏬 Product management (CRUD operations)
- 🏷️ Collection management
- 📦 Order tracking and management
- 🔧 Settings configuration
- 📱 Responsive design for all devices
- 🎨 Beautiful UI with Tailwind CSS
- 🚀 Fast and optimized with Next.js App Router

## Prerequisites

- Node.js 18+ 
- Backend API running at http://localhost:3002 (see backend setup instructions below)

## Getting Started

1. Clone the repository
```bash
git clone <repository-url>
cd admin-panel
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend Setup

The admin panel is designed to work with the BigDeal E-commerce backend. Follow these steps to set up the backend:

1. Navigate to the backend directory
```bash
cd ../backend
```

2. Install dependencies
```bash
npm install
```

3. Reset and seed the database
```bash
node reset-db.js
```

4. Start the backend server
```bash
./start.sh
```

5. Verify the server is running by visiting:
   - REST API: http://localhost:3002/api/products
   - GraphQL endpoint: http://localhost:3002/graphql

## Usage

### Dashboard

The dashboard provides key metrics including:
- Total products
- Active orders
- Total revenue
- Average order value
- Recent orders overview
- Weekly sales chart
- Top-performing products

### Products

The products section allows you to:
- View all products with filtering and sorting
- Add new products
- Edit existing products
- Delete products
- Manage product variants and images

### Collections

The collections section allows you to:
- View all collections
- Create new collections
- Edit collections
- Delete collections
- Assign products to collections

### Orders

The orders section allows you to:
- View all orders with filtering by status
- View order details
- Update order statuses (pending, processing, completed, cancelled)

### Settings

The settings section allows you to configure:
- Store information
- API connection settings

## Production Build

To create a production build:

```bash
npm run build
npm start
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Heroicons](https://heroicons.com/) - Beautiful UI icons
- [Recharts](https://recharts.org/) - Composable charting library
- [React Hot Toast](https://react-hot-toast.com/) - Notifications

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable components
│   │   ├── ui/          # UI components (buttons, cards, etc.)
│   │   ├── products/    # Product-related components
│   │   ├── collections/ # Collection-related components
│   │   └── ...
│   ├── lib/             # Utility functions and API services
│   └── ...
└── ...
```

## License

This project is licensed under the MIT License.
