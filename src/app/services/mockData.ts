export const mockDashboardData = {
  metrics: {
    totalRevenue: "$1,250,000",
    totalExpenses: "$850,000",
    netProfit: "$400,000",
    profitMargin: 32,
    revenueGrowth: 15.5,
    expenseGrowth: 12.3,
    profitGrowth: 18.7,
    marginGrowth: 2.4
  },
  monthlyRevenue: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: ['95000', '115000', '125000', '140000', '160000', '175000']
  },
  cashFlow: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    revenue: ['95000', '115000', '125000', '140000', '160000', '175000'],
    expenses: ['65000', '85000', '90000', '95000', '110000', '125000'],
    profit: {
      Jan: '30000',
      Feb: '30000',
      Mar: '35000',
      Apr: '45000',
      May: '50000',
      Jun: '50000'
    }
  },
  expenseBreakdown: {
    labels: ['Operations', 'Marketing', 'Salaries', 'Equipment', 'Other'],
    data: [30, 25, 20, 15, 10]
  }
};

export const fetchDashboardData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockDashboardData;
};