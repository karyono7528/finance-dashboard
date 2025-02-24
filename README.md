# Finance Analysis Dashboard

A comprehensive financial analysis dashboard built with Laravel 11 and Next.js, designed to analyze company finances by displaying financial reports, spending trends, revenue analysis, and financial predictions.

## Features

### Main Dashboard Widgets
- Total Revenue & Expenses (monthly/yearly)
- Net Profit & Profit Margin
- Cash Flow Trend Charts
- Financial Ratios (ROI, ROE, Gross Margin, etc.)
- Debt & Accounts Receivable Analysis
- Largest Expense Categories

### Charts & Visualizations
- Bar Chart: Monthly Revenue
- Line Chart: Cash Flow Trends
- Pie Chart: Expense Distribution
- Heatmap: Revenue & Expense Fluctuations

## Tech Stack

### Backend
- Laravel 11
- MySQL Database
- RESTful API

### Frontend
- Next.js
- Tailwind CSS
- Chart.js/ApexCharts for visualizations

## Setup Instructions

### Backend Setup
1. Clone the repository
2. Install dependencies: `composer install`
3. Copy .env.example to .env and configure database
4. Generate application key: `php artisan key:generate`
5. Run migrations: `php artisan migrate`
6. Seed database: `php artisan db:seed`

### Frontend Setup
1. Navigate to frontend directory
2. Install dependencies: `npm install`
3. Configure .env.local with API URL
4. Run development server: `npm run dev`

## API Documentation

Detailed API documentation can be found in the `/docs` directory.

## License

MIT License