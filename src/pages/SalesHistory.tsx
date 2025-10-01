import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History, 
  Search, 
  Eye,
  Receipt,
  Filter,
  Calendar
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from '@/hooks/useOrganization';
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string;
  customer_document: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string;
  created_at: string;
  sale_items: SaleItem[];
  sale_payments: SalePayment[];
}

interface SaleItem {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SalePayment {
  id: string;
  payment_method: string;
  amount: number;
  installments: number;
}

const SalesHistory = () => {
  const { organizationId } = useOrganization();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchSales();
    }
  }, [organizationId]);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter, paymentFilter]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      const { data: salesData, error } = await (supabase as any)
        .from('sales')
        .select(`
          *,
          sale_items (*),
          sale_payments (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales((salesData as any) || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico de vendas."
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_document.includes(searchTerm)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Filtro por forma de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.payment_method === paymentFilter);
    }

    setFilteredSales(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      confirmed: { label: "Confirmada", variant: "default" as const },
      delivered: { label: "Entregue", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (method: string) => {
    const methodConfig = {
      cash: { label: "💵 Dinheiro", variant: "secondary" as const },
      credit: { label: "💳 Crédito", variant: "default" as const },
      debit: { label: "💳 Débito", variant: "default" as const },
      pix: { label: "📱 PIX", variant: "default" as const },
      multiple: { label: "🔄 Múltiplo", variant: "outline" as const }
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Histórico de Vendas" 
        description="Consulta e gerenciamento de vendas realizadas"
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar por número, cliente ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Forma de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Formas</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="multiple">Múltiplas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.sale_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sale.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{sale.customer_document}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">R$ {sale.final_amount.toFixed(2)}</p>
                      {sale.discount_amount > 0 && (
                        <p className="text-sm text-green-600">
                          Desconto: R$ {sale.discount_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentBadge(sale.payment_method)}</TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewSaleDetails(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                ? "Nenhuma venda encontrada com os filtros aplicados."
                : "Nenhuma venda realizada ainda."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Venda */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Venda - {selectedSale?.sale_number}
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações da Venda</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Número:</strong> {selectedSale.sale_number}</p>
                    <p><strong>Data:</strong> {format(new Date(selectedSale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedSale.status)}</p>
                    {selectedSale.notes && <p><strong>Observações:</strong> {selectedSale.notes}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {selectedSale.customer_name}</p>
                    <p><strong>Documento:</strong> {selectedSale.customer_document}</p>
                  </div>
                </div>
              </div>

              {/* Itens da Venda */}
              <div>
                <h4 className="font-medium mb-2">Itens Vendidos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.sale_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>R$ {item.total_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totais */}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {selectedSale.total_amount.toFixed(2)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>- R$ {selectedSale.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {selectedSale.final_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Pagamentos */}
              <div>
                <h4 className="font-medium mb-2">Formas de Pagamento</h4>
                <div className="space-y-2">
                  {selectedSale.sale_payments?.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 bg-accent rounded">
                      <span>{getPaymentBadge(payment.payment_method)}</span>
                      <span>
                        R$ {payment.amount.toFixed(2)}
                        {payment.installments > 1 && (
                          <span className="text-sm text-muted-foreground">
                            {" "}({payment.installments}x)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
