import { NextResponse } from 'next/server';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    revenueGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
    marginGrowth: number;
  };
  monthlyRevenue: {
    labels: string[];
    data: number[];
  };
  cashFlow: {
    labels: string[];
    revenue: number[];
    expenses: number[];
    profit: number[];
  };
  expenseDistribution: {
    labels: string[];
    data: number[];
  };
}

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Construct URL with query parameters
    const url = new URL('http://localhost:8000/api/transactions');
    if (startDate) url.searchParams.append('start_date', startDate);
    if (endDate) url.searchParams.append('end_date', endDate);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const responseData = await response.json();
    console.log('Response data:', responseData);
    if (!response.ok) {
      throw new Error('Backend API request failed');
    }
    if (!responseData || !Array.isArray(responseData)) {
      throw new Error('Invalid response format');
    }
    let transactions: Transaction[] = responseData;

    // Filter transactions by date range if provided
    if (startDate || endDate) {
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        const startDateTime = startDate ? new Date(startDate) : null;
        const endDateTime = endDate ? new Date(endDate) : null;

        // Set time to start of day for start date
        if (startDateTime) {
          startDateTime.setHours(0, 0, 0, 0);
        }

        // Set time to end of day for end date
        if (endDateTime) {
          endDateTime.setHours(23, 59, 59, 999);
        }

        // Compare dates
        if (startDateTime && transactionDate < startDateTime) return false;
        if (endDateTime && transactionDate > endDateTime) return false;
        return true;
      });

      // Return empty data if no transactions found in the date range
      if (transactions.length === 0) {
        const emptyDashboardData: DashboardData = {
          metrics: {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
            revenueGrowth: 0,
            expenseGrowth: 0,
            profitGrowth: 0,
            marginGrowth: 0
          },
          monthlyRevenue: {
            labels: [],
            data: []
          },
          cashFlow: {
            labels: [],
            revenue: [],
            expenses: [],
            profit: []
          },
          expenseDistribution: {
            labels: [],
            data: []
          }
        };
        return NextResponse.json(emptyDashboardData);
      }
    }

    // Calculate total revenue and expenses
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    // Process monthly data
    const monthlyData = new Map<string, { revenue: number; expenses: number }>();
    const now = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return d.toISOString().slice(0, 7); // YYYY-MM format
    }).reverse();

    last12Months.forEach(month => {
      monthlyData.set(month, { revenue: 0, expenses: 0 });
    });

    transactions.forEach(transaction => {
      const month = transaction.transaction_date.slice(0, 7);
      if (monthlyData.has(month)) {
        const data = monthlyData.get(month)!;
        if (transaction.type === 'income') {
          data.revenue += transaction.amount;
        } else {
          data.expenses += transaction.amount;
        }
      }
    });

    // Calculate expense distribution
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalExpenseAmount = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    const expenseDistributionData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      percentage: (amount / totalExpenseAmount) * 100
    }));

    // Calculate growth rates (comparing to previous period)
    const previousMonths = last12Months.slice(0, -1);
    const currentMonths = last12Months.slice(1);

    const currentRevenue = currentMonths.reduce((sum, month) => sum + (monthlyData.get(month)?.revenue || 0), 0);
    const previousRevenue = previousMonths.reduce((sum, month) => sum + (monthlyData.get(month)?.revenue || 0), 0);
    const currentExpenses = currentMonths.reduce((sum, month) => sum + (monthlyData.get(month)?.expenses || 0), 0);
    const previousExpenses = previousMonths.reduce((sum, month) => sum + (monthlyData.get(month)?.expenses || 0), 0);

    const revenueGrowth = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expenseGrowth = previousExpenses ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const profitGrowth = previousRevenue ? (((currentRevenue - currentExpenses) - (previousRevenue - previousExpenses)) / (previousRevenue - previousExpenses)) * 100 : 0;
    const marginGrowth = previousRevenue ? (profitMargin - ((previousRevenue - previousExpenses) / previousRevenue * 100)) : 0;

    const dashboardData: DashboardData = {
      metrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        revenueGrowth,
        expenseGrowth,
        profitGrowth,
        marginGrowth
      },
      monthlyRevenue: {
        labels: last12Months.map(month => month.replace('-', ' ')),
        data: last12Months.map(month => monthlyData.get(month)?.revenue || 0)
      },
      cashFlow: {
        labels: last12Months.map(month => month.replace('-', ' ')),
        revenue: last12Months.map(month => monthlyData.get(month)?.revenue || 0),
        expenses: last12Months.map(month => monthlyData.get(month)?.expenses || 0),
        profit: last12Months.map(month => {
          const data = monthlyData.get(month);
          return (data?.revenue || 0) - (data?.expenses || 0);
        })
      },
      expenseDistribution: {
        labels: Object.keys(expensesByCategory),
        data: Object.values(expensesByCategory).map(amount => 
          (amount / totalExpenses) * 100
        )
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error processing transactions:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process transactions' }),
      { status: 500 }
    );
  }
}