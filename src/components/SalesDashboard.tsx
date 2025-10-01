import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from '@/hooks/useOrganization';

interface SalesAnalytics {
  period: string;
  total_sales: number;
  total_revenue: number;
  average_ticket: number;
  top_products: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  sales_by_day: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesDashboard = () => {
  const { organizationId } = useOrganization();
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (organizationId) {
      fetchAnalytics();
    }
  }, [organizationId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .rpc('get_sales_analytics', { 
          p_organization_id: organizationId,
          p_period: period 
        });

      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_sales}</div>
            <p className="text-xs text-muted-foreground">
              {period === 'week' ? 'últimos 7 dias' : period === 'month' ? 'últimos 30 dias' : 'último ano'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {analytics.total_revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'week' ? 'últimos 7 dias' : period === 'month' ? 'últimos 30 dias' : 'último ano'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {analytics.average_ticket.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.top_products?.reduce((total, product) => total + product.total_quantity, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              unidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.sales_by_day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                  formatter={(value, name) => [
                    name === 'sales_count' ? `${value} vendas` : `R$ ${Number(value).toFixed(2)}`,
                    name === 'sales_count' ? 'Vendas' : 'Receita'
                  ]}
                />
                <Bar dataKey="sales_count" fill="#8884d8" name="sales_count" />
                <Bar dataKey="revenue" fill="#82ca9d" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.top_products && analytics.top_products.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.top_products}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_quantity"
                      label={({ product_name, total_quantity }) => `${total_quantity}`}
                    >
                      {analytics.top_products.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} unidades`,
                        props.payload.product_name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  {analytics.top_products.map((product, index) => (
                    <div key={product.product_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{product.product_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.total_quantity} un</p>
                        <p className="text-xs text-muted-foreground">R$ {product.total_revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma venda registrada no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesDashboard;
