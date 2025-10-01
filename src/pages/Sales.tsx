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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  Calculator,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  History
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from '@/hooks/useOrganization';
import { PageHeader } from "@/components/PageHeader";
import PixPaymentDialog from "@/components/PixPaymentDialog";
import PagBankPaymentDialog from "@/components/PagBankPaymentDialog";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  is_low_stock: boolean;
}

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  discount_amount: number;
}

interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
}

const Sales = () => {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  // Estados do pagamento
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [installments, setInstallments] = useState(1);
  const [change, setChange] = useState(0);

  // Estados para pagamento PIX e Maquininha
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [showPagBankDialog, setShowPagBankDialog] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
      fetchCustomers();
    }
  }, [organizationId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_products_for_sale', { p_organization_id: organizationId });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os produtos."
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, document, email, phone')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Verificar se há estoque suficiente
      if (existingItem.quantity >= product.quantity) {
        toast({
          variant: "destructive",
          title: "Estoque insuficiente",
          description: `Disponível: ${product.quantity} unidades`
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: product.selling_price,
        quantity: 1,
        total_price: product.selling_price,
        discount_amount: 0
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const product = products.find(p => p.id === cart.find(c => c.id === itemId)?.product_id);
    if (product && newQuantity > product.quantity) {
      toast({
        variant: "destructive",
        title: "Estoque insuficiente",
        description: `Disponível: ${product.quantity} unidades`
      });
      return;
    }

    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0) - discount;
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setNotes("");
    setPaymentAmount(0);
    setChange(0);
  };

  // Função para gerar e imprimir NFCe
  const generateAndPrintNFCe = (saleData: any, customer: any, items: any[], payments: any[]) => {
    const nfceData = {
      numeroNota: saleData.sale_number,
      dataEmissao: new Date().toLocaleString('pt-BR'),
      empresa: {
        razaoSocial: "Paulo Cell Sistema",
        cnpj: "00.000.000/0001-00",
        endereco: "Rua Principal, 123 - Centro",
        cidade: "Sua Cidade - ES",
        telefone: "(27) 99999-9999"
      },
      cliente: {
        nome: customer.name,
        documento: customer.document || "000.000.000-00"
      },
      itens: items.map((item, index) => ({
        item: index + 1,
        codigo: item.product_sku || 'SEM-SKU',
        descricao: item.product_name,
        quantidade: item.quantity,
        valorUnitario: item.unit_price,
        desconto: item.discount_amount || 0,
        valorTotal: (item.unit_price * item.quantity) - (item.discount_amount || 0)
      })),
      pagamentos: payments.map(payment => ({
        forma: getPaymentMethodName(payment.method),
        valor: payment.amount,
        parcelas: payment.installments
      })),
      totais: {
        subtotal: saleData.subtotal || cart.reduce((total, item) => total + item.total_price, 0),
        desconto: saleData.discount_amount || discount,
        total: saleData.final_amount || getCartTotal()
      }
    };

    // Gerar HTML da NFCe
    const nfceHtml = generateNFCeHTML(nfceData);
    
    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(nfceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Função para gerar HTML da NFCe
  const generateNFCeHTML = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>NFCe - ${data.numeroNota}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .linha { border-top: 1px dashed #000; margin: 5px 0; }
          .item { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { font-size: 14px; font-weight: bold; }
          @media print { 
            body { font-size: 10px; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center bold">
          ${data.empresa.razaoSocial}
        </div>
        <div class="center">
          CNPJ: ${data.empresa.cnpj}
        </div>
        <div class="center">
          ${data.empresa.endereco}
        </div>
        <div class="center">
          ${data.empresa.cidade}
        </div>
        <div class="center">
          Tel: ${data.empresa.telefone}
        </div>
        
        <div class="linha"></div>
        
        <div class="center bold">
          NOTA FISCAL DE CONSUMIDOR ELETRÔNICA
        </div>
        <div class="center">
          NFCe: ${data.numeroNota}
        </div>
        <div class="center">
          ${data.dataEmissao}
        </div>
        
        <div class="linha"></div>
        
        <div class="bold">CLIENTE:</div>
        <div>${data.cliente.nome}</div>
        <div>CPF: ${data.cliente.documento}</div>
        
        <div class="linha"></div>
        
        <div class="bold">PRODUTOS:</div>
        ${data.itens.map((item: any) => `
          <div style="margin: 5px 0;">
            <div class="bold">${item.descricao}</div>
            <div class="item">
              <span>${item.quantidade} x R$ ${item.valorUnitario.toFixed(2)}</span>
              <span>R$ ${item.valorTotal.toFixed(2)}</span>
            </div>
            ${item.desconto > 0 ? `<div class="item"><span>Desconto:</span><span>-R$ ${item.desconto.toFixed(2)}</span></div>` : ''}
          </div>
        `).join('')}
        
        <div class="linha"></div>
        
        ${data.totais.desconto > 0 ? `
          <div class="item">
            <span>Subtotal:</span>
            <span>R$ ${data.totais.subtotal.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Desconto:</span>
            <span>-R$ ${data.totais.desconto.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="item total">
          <span>TOTAL:</span>
          <span>R$ ${data.totais.total.toFixed(2)}</span>
        </div>
        
        <div class="linha"></div>
        
        <div class="bold">PAGAMENTO:</div>
        ${data.pagamentos.map((pag: any) => `
          <div class="item">
            <span>${pag.forma}${pag.parcelas > 1 ? ` (${pag.parcelas}x)` : ''}</span>
            <span>R$ ${pag.valor.toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="linha"></div>
        
        <div class="center">
          Obrigado pela preferência!
        </div>
        <div class="center">
          Volte sempre!
        </div>
        
        <div class="linha"></div>
        <div class="center" style="font-size: 10px;">
          Sistema Paulo Cell - NFCe Simplificada
        </div>
        
        <script>
          // Auto-imprimir ao carregar
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // Fechar janela após impressão
              setTimeout(() => window.close(), 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Função para obter nome do método de pagamento
  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência Bancária'
    };
    return methods[method] || method;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda."
      });
      return;
    }

    // Cliente é opcional - se não selecionado, usar dados padrão
    const customer = selectedCustomer || {
      id: null,
      name: "Cliente Não Identificado",
      document: "00000000000"
    };

    try {
      setIsProcessingSale(true);

      // Preparar dados dos itens
      const items = cart.map(item => ({
        inventory_item_id: item.product_id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount
      }));

      // Preparar dados do pagamento
      const payments = [{
        method: paymentMethod,
        amount: getCartTotal(),
        installments: installments,
        transaction_id: crypto.randomUUID()
      }];

      // Processar venda
      const { data, error } = await (supabase as any)
        .rpc('process_sale', {
          p_customer_id: customer.id,
          p_customer_name: customer.name,
          p_customer_document: customer.document,
          p_items: JSON.stringify(items),
          p_payments: JSON.stringify(payments),
          p_discount_amount: discount,
          p_notes: notes,
          p_organization_id: organizationId
        });

      if (error) throw error;

      if (!(data as any).success) {
        throw new Error((data as any).error || 'Erro ao processar venda');
      }

      // Gerar e imprimir NFCe
      const saleData = data as any;
      generateAndPrintNFCe(saleData, customer, items, payments);

      toast({
        title: "Venda realizada!",
        description: `Venda ${saleData.sale_number} processada com sucesso. Total: R$ ${saleData.final_amount.toFixed(2)}`
      });

      // Limpar carrinho e atualizar produtos
      clearCart();
      setShowPaymentDialog(false);
      fetchProducts();

    } catch (error: any) {
      console.error('Error processing sale:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar venda",
        description: error.message || "Ocorreu um erro inesperado."
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.document.includes(customerSearchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="PDV - Ponto de Venda" 
          description="Sistema de vendas integrado"
        />
        <Button 
          variant="outline"
          onClick={() => navigate('/dashboard/sales/history')}
        >
          <History className="h-4 w-4 mr-2" />
          Histórico
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Produtos Disponíveis
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          <Badge variant={product.is_low_stock ? "destructive" : "secondary"} className="mt-1">
                            {product.quantity} em estoque
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {product.selling_price.toFixed(2)}</p>
                          <Button 
                            size="sm" 
                            onClick={() => addToCart(product)}
                            disabled={product.quantity === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Cliente Selecionado */}
              <div className="mb-4">
                <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedCustomer ? selectedCustomer.name : "Selecionar Cliente (Opcional)"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Selecionar Cliente (Opcional)</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Você pode finalizar a venda sem selecionar um cliente específico
                      </p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Buscar cliente..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 border rounded cursor-pointer hover:bg-accent"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerDialog(false);
                              setCustomerSearchTerm("");
                            }}
                          >
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.document}</p>
                            {customer.phone && (
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Itens do Carrinho */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">R$ {item.unit_price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desconto */}
              <div className="mb-4">
                <label className="text-sm font-medium">Desconto (R$)</label>
                <Input
                  type="number"
                  value={discount || 0}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {cart.reduce((total, item) => total + item.total_price, 0).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto:</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>R$ {getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-2">
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={cart.length === 0}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finalizar Venda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p><strong>Cliente:</strong> {selectedCustomer?.name || "Cliente Não Identificado"}</p>
                        <p><strong>Total:</strong> R$ {getCartTotal().toFixed(2)}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Forma de Pagamento</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">💵 Dinheiro</SelectItem>
                            <SelectItem value="credit">💳 Cartão de Crédito</SelectItem>
                            <SelectItem value="debit">💳 Cartão de Débito</SelectItem>
                            <SelectItem value="pix">📱 PIX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentMethod === 'cash' && (
                        <div>
                          <label className="text-sm font-medium">Valor Recebido</label>
                          <Input
                            type="number"
                            value={paymentAmount || 0}
                            onChange={(e) => {
                              const received = Number(e.target.value) || 0;
                              setPaymentAmount(received);
                              setChange(Math.max(0, received - getCartTotal()));
                            }}
                            placeholder="0,00"
                          />
                          {change > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              Troco: R$ {change.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                        <div>
                          <label className="text-sm font-medium">
                            {paymentMethod === 'credit' ? 'Parcelas' : 'Confirmar Débito'}
                          </label>
                          {paymentMethod === 'credit' ? (
                            <Select value={installments.toString()} onValueChange={(v) => setInstallments(Number(v))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                  <SelectItem key={n} value={n.toString()}>
                                    {n}x de R$ {(getCartTotal() / n).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Button 
                              className="w-full mt-2"
                              onClick={() => {
                                setShowPaymentDialog(false);
                                setShowPagBankDialog(true);
                              }}
                            >
                              Processar com Maquininha PagBank
                            </Button>
                          )}
                        </div>
                      )}

                      {paymentMethod === 'pix' && (
                        <div>
                          <Button 
                            className="w-full"
                            onClick={() => {
                              setShowPaymentDialog(false);
                              setShowPixDialog(true);
                            }}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Gerar QR Code PIX
                          </Button>
                        </div>
                      )}

                      {/* Alerta sobre métodos de pagamento especiais */}
                      {(paymentMethod === 'pix' || paymentMethod === 'debit' || paymentMethod === 'credit') && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            {paymentMethod === 'pix' 
                              ? '💡 O QR Code PIX será gerado após clicar em "Gerar QR Code PIX"'
                              : '💡 A transação será processada pela maquininha PagBank ModerninhaPro2'}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium">Observações</label>
                        <Input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações da venda..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPaymentDialog(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={processSale}
                          disabled={isProcessingSale || (paymentMethod === 'cash' && paymentAmount < getCartTotal())}
                          className="flex-1"
                        >
                          {isProcessingSale ? "Processando..." : "Confirmar Venda"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Pagamento PIX */}
      <PixPaymentDialog
        open={showPixDialog}
        onOpenChange={setShowPixDialog}
        amount={getCartTotal()}
        orderId={`VND-${Date.now()}`}
        onPaymentConfirmed={() => {
          processSale();
        }}
        pixKey="suachavepix@exemplo.com"
      />

      {/* Dialog de Pagamento Maquininha PagBank */}
      <PagBankPaymentDialog
        open={showPagBankDialog}
        onOpenChange={setShowPagBankDialog}
        amount={getCartTotal()}
        orderId={`VND-${Date.now()}`}
        onPaymentConfirmed={(transactionId) => {
          console.log('Transação PagBank:', transactionId);
          processSale();
        }}
        apiKey="sua-api-key-pagbank"
      />
    </div>
  );
};

export default Sales;
