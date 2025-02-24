import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Replace with actual API call to Laravel backend
    const mockData = {
      metrics: {
        totalRevenue: "$150,000",
        totalExpenses: "$75,000",
        netProfit: "$75,000",
        profitMargin: 50,
        revenueGrowth: 15,
        expenseGrowth: 10,
        profitGrowth: 20,
        marginGrowth: 5
      },
      monthlyRevenue: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: ['12000', '15000', '18000', '20000', '22000', '25000']
      },
      cashFlow: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        revenue: ['15000', '18000', '20000', '22000', '25000', '28000'],
        expenses: ['8000', '9000', '10000', '11000', '12000', '13000'],
        profit: {
          Jan: '7000',
          Feb: '9000',
          Mar: '10000',
          Apr: '11000',
          May: '13000',
          Jun: '15000'
        }
      },
      expenseDistribution: {
        labels: ['Salaries', 'Marketing', 'Operations', 'Technology', 'Office', 'Others'],
        data: [40, 20, 15, 10, 10, 5]
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}