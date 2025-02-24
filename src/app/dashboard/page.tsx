'use client';

import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  metrics: {
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    profitMargin: number;
    revenueGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
    marginGrowth: number;
  };
  monthlyRevenue: {
    labels: string[];
    data: string[];
  };
  cashFlow: {
    labels: string[];
    revenue: string[];
    expenses: string[];
    profit: Record<string, string>;
  };
  expenseDistribution: {
    labels: string[];
    data: number[];
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshInterval] = useState(30000); // 30 seconds refresh interval

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const transactions = await response.json();
      
      if (!Array.isArray(transactions)) {
        throw new Error('Invalid response format - expected array of transactions');
      }

      // Format currency values
      const formatCurrency = (value: number): string => {
        return value.toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      // Calculate total revenue and expenses
      const totalRevenue = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

      // Group transactions by month for time series
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
            data.revenue += Number(transaction.amount);
          } else {
            data.expenses += Number(transaction.amount);
          }
        }
      });

      // Calculate growth rates
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

      // Calculate expense distribution
      const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const totalExpenseAmount = Object.values(expensesByCategory).reduce<number>((acc, curr) => acc + Number(curr), 0);
      
      const transformedData: DashboardData = {
        metrics: {
          totalRevenue: formatCurrency(totalRevenue),
          totalExpenses: formatCurrency(totalExpenses),
          netProfit: formatCurrency(netProfit),
          profitMargin,
          revenueGrowth,
          expenseGrowth,
          profitGrowth,
          marginGrowth
        },
        monthlyRevenue: {
          labels: last12Months,
          data: last12Months.map(month => monthlyData.get(month)?.revenue.toString() || '0')
        },
        cashFlow: {
          labels: last12Months,
          revenue: last12Months.map(month => formatCurrency(monthlyData.get(month)?.revenue || 0)),
          expenses: last12Months.map(month => formatCurrency(monthlyData.get(month)?.expenses || 0)),
          profit: last12Months.reduce((acc, month) => ({
            ...acc,
            [month]: formatCurrency((monthlyData.get(month)?.revenue || 0) - (monthlyData.get(month)?.expenses || 0))
          }), {})
        },
        expenseDistribution: {
          labels: Object.keys(expensesByCategory),
          data: (Object.values(expensesByCategory) as number[]).map(amount => (amount / totalExpenseAmount) * 100)
        }
      };

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      fetchData();
    }, autoRefreshInterval);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!data) return <div className="p-4">No data available</div>;

  // Date range picker component
  const dateRangePicker = (
    <div className="mb-4 flex gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange('start', e.target.value)}
          className="border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange('end', e.target.value)}
          className="border rounded p-2"
        />
      </div>
    </div>
  );

  const metricCard = (title: string, value: string | number, growth?: number) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-2">
        {typeof value === 'string' ? `Rp ${value}` : `${value.toFixed(2)}%`}
      </p>
      {growth !== undefined && (
        <p className={`text-sm ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}%
        </p>
      )}
    </div>
  );

  const cashFlowChartData = {
    labels: data?.cashFlow?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.cashFlow?.revenue?.map(value => typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: data?.cashFlow?.expenses?.map(value => typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value) || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const expenseDistributionData = {
    labels: data?.expenseDistribution?.labels || [],
    datasets: [
      {
        data: data?.expenseDistribution?.data || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF99CC',
        ],
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      {dateRangePicker}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCard('Total Revenue', data?.metrics?.totalRevenue || '0', data?.metrics?.revenueGrowth || 0)}
        {metricCard('Total Expenses', data?.metrics?.totalExpenses || '0', data?.metrics?.expenseGrowth || 0)}
        {metricCard('Net Profit', data?.metrics?.netProfit || '0', data?.metrics?.profitGrowth || 0)}
        {metricCard('Profit Margin', data?.metrics?.profitMargin || 0, data?.metrics?.marginGrowth || 0)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
          <Line
            data={cashFlowChartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `Rp ${value.toLocaleString('id-ID')}`
                  }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Expense Distribution</h2>
          <Doughnut
            data={expenseDistributionData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right' as const,
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.parsed.toFixed(2)}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}