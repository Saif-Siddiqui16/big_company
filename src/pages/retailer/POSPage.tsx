import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  List,
  Typography,
  Tag,
  Divider,
  Modal,
  Input,
  Radio,
  message,
  Space,
  Badge,
  Spin,
  Statistic,
  Empty,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  WalletOutlined,
  MobileOutlined,
  SearchOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';
import { printThermalReceipt } from '../../utils/receiptPrinter';

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  category: string;
  stock: number;
  barcode?: string;
  image?: string;
  unit?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface DailySalesStats {
  total_sales: number;
  transaction_count: number;
  mobile_payment_transactions: number;  // Mobile Money (MTN/Airtel)
  dashboard_wallet_transactions: number; // Dashboard Wallet payments
  credit_wallet_transactions: number;    // Credit Wallet payments
  gas_rewards_m3: number;               // Gas rewards given in M³
  gas_rewards_rwf: number;              // Gas rewards value in RWF
  max_discount_pct?: number;            // Dynamic limit from backend
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  wallet_balance: number;
  credit_limit: number;
  credit_used: number;
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Barcode scan quantity modal
  const [scanModal, setScanModal] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [scanLoading, setScanLoading] = useState(false);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bigshop_card' | 'momo' | 'airtel' | 'cash'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  // Big Shop Card payment flow
  const [cardStep, setCardStep] = useState<'tap' | 'pin' | 'wallet_choice' | 'reward_id'>('tap');
  const [cardWalletType, setCardWalletType] = useState<'dashboard' | 'credit'>('dashboard');
  const [cardPin, setCardPin] = useState('');
  const [cardUid, setCardUid] = useState('');

  // Mobile Money payment
  const [mobileProvider, setMobileProvider] = useState<'mtn' | 'airtel'>('mtn');

  // Customer state (for wallet/credit payments)
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Gas Reward Wallet ID for rewards
  const [gasRewardWalletId, setGasRewardWalletId] = useState('');

  // Daily stats
  const [dailyStats, setDailyStats] = useState<DailySalesStats | null>(null);

  // Receipt modal
  const [receiptModal, setReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Discount
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('percent');

  const barcodeInputRef = useRef<any>(null);

  // Load products and daily stats
  useEffect(() => {
    loadProducts();
    loadDailyStats();

    // Refresh stats every minute
    const interval = setInterval(loadDailyStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await retailerApi.getPOSProducts({ limit: 100 });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Fallback to inventory
      try {
        const response = await retailerApi.getInventory({ limit: 100 });
        setProducts(response.data?.products || []);
      } catch (err) {
        message.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await retailerApi.getDailySales();
      setDailyStats(response.data);
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  };

  // Search products
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      loadProducts();
      return;
    }
    setSearchLoading(true);
    try {
      const response = await retailerApi.getPOSProducts({ search: query });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Barcode scanning — directly adds product to cart for fast desktop cashier scanning
  const handleBarcodeScan = async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    setScanLoading(true);

    try {
      // 1. Instant local match from already loaded products
      const localProduct = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === code.toLowerCase())
      );

      if (localProduct) {
        addToCart(localProduct);
        message.success(`Added: ${localProduct.name}`);
        setBarcodeInput('');
        setTimeout(() => barcodeInputRef.current?.focus(), 50);
        return;
      }

      // 2. Query backend if not loaded locally
      const response = await retailerApi.scanBarcode(code);
      if (response.data?.product) {
        addToCart(response.data.product);
        message.success(`Added: ${response.data.product.name}`);
      } else {
        message.warning('Product not found for this barcode');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Barcode scan failed');
    } finally {
      setScanLoading(false);
      setBarcodeInput('');
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  // Confirm scanned product with entered quantity
  const confirmScanAdd = () => {
    if (!scannedProduct) return;
    if (!scanQuantity || scanQuantity <= 0) {
      message.warning('Please enter a valid quantity greater than zero');
      return;
    }
    if (scanQuantity > scannedProduct.stock) {
      message.warning(`Only ${scannedProduct.stock} units available`);
      return;
    }
    const isDecimalAllowed = scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters';
    const rounded = isDecimalAllowed
      ? Math.round(scanQuantity * 100) / 100
      : Math.round(scanQuantity);

    if (rounded <= 0) {
      message.warning('Please enter a valid quantity greater than zero');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === scannedProduct.id);
      if (existing) {
        const newQty = isDecimalAllowed
          ? Math.round((existing.quantity + rounded) * 100) / 100
          : Math.round(existing.quantity + rounded);
        if (newQty > scannedProduct.stock) {
          message.warning(`Only ${scannedProduct.stock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.id === scannedProduct.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...scannedProduct, quantity: rounded }];
    });
    message.success(`Added ${rounded} × ${scannedProduct.name} to cart`);
    setScanModal(false);
    setScannedProduct(null);
    setScanQuantity(1);
    barcodeInputRef.current?.focus();
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      message.warning('Product out of stock');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          message.warning(`Only ${product.stock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.stock) {
            message.warning(`Only ${item.stock} units available`);
            return item;
          }
          return { ...item, quantity: Math.max(0, newQty) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const setItemQuantity = (id: string, quantity: number | null) => {
    if (quantity === null || quantity === undefined || isNaN(quantity)) return;
    if (quantity <= 0) {
      message.warning('Quantity must be greater than zero');
      return;
    }
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const isDecimalAllowed = item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'liters';
          const rounded = isDecimalAllowed
            ? Math.round(quantity * 100) / 100
            : Math.round(quantity);
          if (rounded <= 0) return item;
          if (rounded > item.stock) {
            message.warning(`Only ${item.stock} units available`);
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity: rounded };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Calculate inclusive 18% VAT
  const TAX_RATE = 0.18; // 18% VAT
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal - (subtotal / (1 + TAX_RATE));
  const discountAmount = discountType === 'percent'
    ? (subtotal * discount / 100)
    : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Complete the sale
  const completeSale = async (method: string, paymentDetails?: any) => {
    setProcessing(true);

    try {
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          cost_price: item.cost_price,
        })),
        subtotal,
        tax_amount: taxAmount,
        tax_rate: TAX_RATE,
        payment_method: method as any,
        customer_phone: customer?.phone || customerPhone || undefined,
        discount: discountAmount > 0 ? discountAmount : undefined,
        gasRewardWalletId: paymentDetails?.gasRewardWalletId || gasRewardWalletId || undefined,
        payment_details: paymentDetails,
      };

      const response = await retailerApi.createSale(saleData);

      if (response.data?.success) {
        const isMoMoPending = method === 'mobile_money' && response.data.status === 'pending_payment';

        if (isMoMoPending) {
          // MoMo: payment is waiting for customer to enter PIN on phone
          message.info('Payment request sent to customer\'s phone. Sale will be confirmed once they approve the MoMo prompt.');
        } else {
          // Cash / Wallet / NFC: payment is complete immediately
          message.success('Sale completed successfully!');
          const completedSale = {
            ...response.data,
            items: cart,
            subtotal,
            tax: taxAmount,
            discount: discountAmount,
            total,
            method,
            cashReceived: method === 'cash' ? (cashTendered || total) : undefined,
            change: method === 'cash' ? Math.max(0, (cashTendered || total) - total) : undefined,
            gasRewardWalletId: paymentDetails?.gasRewardWalletId || gasRewardWalletId,
          };
          setLastSale(completedSale);
          setReceiptModal(true);

          // AUTO-PRINT THERMAL RECEIPT IMMEDIATELY
          printThermalReceipt({
            receiptNo: '#' + (response.data?.sale?.id?.toString().padStart(6, '0') || '000000'),
            date: response.data?.sale?.createdAt || new Date(),
            paymentMethod: method.toUpperCase(),
            items: cart.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.price,
              total: i.price * i.quantity,
              unit: i.unit,
              sku: i.sku,
            })),
            subtotal,
            tax: taxAmount,
            discount: discountAmount,
            total,
            cashReceived: method === 'cash' ? (cashTendered || total) : undefined,
            change: method === 'cash' ? Math.max(0, (cashTendered || total) - total) : undefined,
            gasRewardWalletId: paymentDetails?.gasRewardWalletId || gasRewardWalletId,
          }, { autoPrint: true });
        }

        // Reset state regardless of payment type (prevents double-submit)
        setPaymentModal(false);
        setCart([]);
        setDiscount(0);
        setCustomer(null);
        setCustomerPhone('');
        setCardStep('tap');
        setCardPin('');
        setCardUid('');
        setGasRewardWalletId('');
        setCashTendered(0);

        // Refresh stats and products
        loadDailyStats();
        loadProducts();
      } else {
        throw new Error(response.data?.error || 'Sale failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Sale failed';
      
      if (errorMsg.includes('Discount Blocked')) {
        Modal.error({
          title: 'Transaction Blocked (Security Guardrail)',
          content: errorMsg,
          okText: 'Understood',
          okButtonProps: { danger: true }
        });
      } else {
        message.error(errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle payment based on method
  const handlePayment = async () => {
    if (cart.length === 0) {
      message.error('Cart is empty');
      return;
    }

    let paymentType: string;
    let paymentDetails: any = {};

    switch (paymentMethod) {
      case 'cash':
        paymentType = 'cash';
        paymentDetails = {
          cash_tendered: cashTendered || total,
          change: Math.max(0, (cashTendered || total) - total),
          gasRewardWalletId: gasRewardWalletId || undefined,
        };
        break;

      case 'bigshop_card':
        paymentType = 'nfc';
        paymentDetails = {
          uid: cardUid.trim(),
          pin: cardPin,
          wallet_type: cardWalletType,
        };
        console.log('Sending NFC Payment Data:', paymentDetails);
        break;

      case 'momo':
      case 'airtel':
        if (!customerPhone || customerPhone.length < 10) {
          message.error('Please enter a valid phone number');
          return;
        }
        paymentType = 'mobile_money';
        paymentDetails = {
          provider: paymentMethod === 'momo' ? 'mtn' : 'airtel',
          phone: customerPhone,
          gasRewardWalletId: gasRewardWalletId || undefined,
        };
        break;

      default:
        message.error('Invalid payment method');
        return;
    }

    await completeSale(paymentType, paymentDetails);
  };

  // Print receipt
  const printReceipt = () => {
    if (!lastSale) return;
    printThermalReceipt({
      receiptNo: '#' + (lastSale.sale?.id?.toString().padStart(6, '0') || '000000'),
      date: lastSale.sale?.createdAt || new Date(),
      paymentMethod: (lastSale.method || lastSale.sale?.paymentMethod || 'CASH').toUpperCase(),
      items: (lastSale.items || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.price * i.quantity,
        unit: i.unit,
        sku: i.sku,
      })),
      subtotal: lastSale.subtotal || 0,
      tax: lastSale.tax || 0,
      discount: lastSale.discount || 0,
      total: lastSale.total || 0,
      cashReceived: lastSale.cashReceived,
      change: lastSale.change,
      gasRewardWalletId: lastSale.gasRewardWalletId,
    }, { autoPrint: true });
  };

  // Filtered products
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: 'calc(100vh - 64px)' }}>
      {/* Daily Stats Banner */}
      {dailyStats && (
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={5}>
              <Statistic
                title="Total Sales"
                value={dailyStats.total_sales}
                suffix="RWF"
                styles={{ content: { color: '#3f8600', fontSize: '16px' } }}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Mobile Payment"
                value={dailyStats.mobile_payment_transactions || 0}
                prefix={<MobileOutlined />}
                styles={{ content: { fontSize: '16px', color: '#faad14' } }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Dashboard Wallet"
                value={dailyStats.dashboard_wallet_transactions || 0}
                prefix={<WalletOutlined />}
                styles={{ content: { fontSize: '16px', color: '#1890ff' } }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Credit Wallet"
                value={dailyStats.credit_wallet_transactions || 0}
                prefix={<CreditCardOutlined />}
                styles={{ content: { fontSize: '16px', color: '#722ed1' } }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Gas Rewards"
                value={`${(dailyStats.gas_rewards_m3 || 0).toFixed(4)} M³`}
                suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>({(dailyStats.gas_rewards_rwf || 0).toLocaleString()} RWF)</span>}
                styles={{ content: { fontSize: '16px', color: '#fa541c' } }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={16} style={{ height: 'calc(100% - 100px)' }}>
        {/* Products Grid */}
        <Col xs={24} lg={16} style={{ height: '100%', overflow: 'auto' }}>
          <Card
            title="Products"
            extra={
              <Space>
                <Input
                  placeholder="Scan barcode → Enter qty"
                  prefix={<BarcodeOutlined />}
                  suffix={scanLoading ? <Spin size="small" /> : null}
                  value={barcodeInput}
                  ref={barcodeInputRef}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onPressEnter={() => handleBarcodeScan(barcodeInput)}
                  style={{ width: 170 }}
                />
                <Input.Search
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  loading={searchLoading}
                  style={{ width: 150 }}
                  allowClear
                />
              </Space>
            }
          >
            {filteredProducts.length === 0 ? (
              <Empty description="No products found" />
            ) : (
              <Row gutter={[12, 12]}>
                {filteredProducts.map((product) => (
                  <Col xs={12} sm={8} md={6} key={product.id}>
                    <Card
                      hoverable
                      onClick={() => addToCart(product)}
                      size="small"
                      style={{
                        textAlign: 'center',
                        opacity: product.stock === 0 ? 0.5 : 1,
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Badge
                        count={product.stock <= 10 ? `${product.stock} left` : 0}
                        style={{ backgroundColor: product.stock <= 5 ? '#f5222d' : '#faad14' }}
                      >
                        <div style={{ padding: '8px 0' }}>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: 60, height: 60, objectFit: 'cover', margin: '0 auto 8px', borderRadius: 8, display: 'block' }}
                            />
                          ) : (
                            <div style={{ width: 60, height: 60, background: '#f0f0f0', margin: '0 auto 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingCartOutlined style={{ fontSize: 24, color: '#ccc' }} />
                            </div>
                          )}
                          <Text strong style={{ display: 'block', fontSize: '13px' }}>{product.name}</Text>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                            {product.sku}
                          </Text>
                          <Text strong style={{ color: '#0ea5e9', fontSize: '16px' }}>
                            {product.price?.toLocaleString()} RWF
                          </Text>
                          {product.stock === 0 && (
                            <Tag color="red" style={{ marginTop: 4 }}>OUT OF STOCK</Tag>
                          )}
                        </div>
                      </Badge>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {/* Cart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <span>Cart</span>
                {itemCount > 0 && <Tag color="blue">{itemCount} items</Tag>}
              </Space>
            }
            extra={
              cart.length > 0 && (
                <Button type="text" danger size="small" onClick={clearCart}>
                  Clear
                </Button>
              )
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' } }}
          >
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                <BarcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <Text type="secondary" style={{ display: 'block' }}>
                  Scan barcode or click products to add
                </Text>
              </div>
            ) : (
              <>
                <List
                  dataSource={cart}
                  style={{ flex: 1, overflow: 'auto' }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                            </div>
                          )
                        }
                        title={
                          <Text style={{ fontSize: '13px' }}>{item.name}</Text>
                        }
                        description={
                          <div>
                            <Space align="center" style={{ marginBottom: 4 }}>
                              <Button
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={() => updateQuantity(item.id, -1)}
                              />
                              <InputNumber
                                size="small"
                                min={item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'liters' ? 0.01 : 1}
                                max={item.stock}
                                step={item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'liters' ? 0.25 : 1}
                                value={item.quantity}
                                onChange={(val) => setItemQuantity(item.id, val)}
                                style={{ width: 65 }}
                                precision={item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'liters' ? 2 : 0}
                              />
                              <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock}
                              />
                            </Space>
                            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                              {item.price?.toLocaleString()} RWF × {item.quantity}
                            </div>
                          </div>
                        }
                      />
                      <Text strong style={{ fontSize: '13px' }}>
                        {(item.price * item.quantity).toLocaleString()} RWF
                      </Text>
                    </List.Item>
                  )}
                />

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ marginTop: 'auto' }}>
                  {/* Discount */}
                  <Row gutter={8} style={{ marginBottom: 12 }}>
                    <Col span={16}>
                      <InputNumber
                        placeholder="Discount"
                        value={discount}
                        onChange={(val) => setDiscount(val || 0)}
                        style={{ width: '100%' }}
                        min={0}
                        max={discountType === 'percent' ? 100 : subtotal}
                      />
                    </Col>
                    <Col span={8}>
                      <Radio.Group
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        size="small"
                      >
                        <Radio.Button value="fixed">RWF</Radio.Button>
                        <Radio.Button value="percent">%</Radio.Button>
                      </Radio.Group>
                    </Col>
                  </Row>

                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>Subtotal:</Text>
                    <Text>{subtotal.toLocaleString()} RWF</Text>
                  </Row>
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text type="secondary">Tax (18% VAT Included):</Text>
                    <Text type="secondary">{taxAmount.toLocaleString()} RWF</Text>
                  </Row>
                  {discountAmount > 0 && (
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Text type="success">Discount:</Text>
                      <Text type="success">-{discountAmount.toLocaleString()} RWF</Text>
                    </Row>
                  )}
                  <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>Total:</Title>
                    <Title level={4} style={{ margin: 0, color: '#0ea5e9' }}>
                      {total.toLocaleString()} RWF
                    </Title>
                  </Row>

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => {
                      if (discountAmount > 0 && subtotal > 0) {
                        const requestedDiscountPct = (discountAmount / subtotal) * 100;
                        const maxAllowedDiscount = dailyStats?.max_discount_pct ?? 5; 

                        if (requestedDiscountPct > maxAllowedDiscount) {
                          Modal.error({
                            title: 'Transaction Blocked (Security Guardrail)',
                            content: `Transaction Blocked: The requested discount of ${requestedDiscountPct.toFixed(1)}% exceeds the Admin-approved maximum limit of ${maxAllowedDiscount}%. Please lower the discount to proceed.`,
                            okText: 'Understood',
                            okButtonProps: { danger: true }
                          });
                          return; // Block checkout
                        }
                      }
                      setPaymentModal(true);
                    }}
                    disabled={cart.length === 0}
                  >
                    Checkout ({itemCount} items)
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Payment"
        open={paymentModal}
        onCancel={() => {
          setPaymentModal(false);
          setCardStep('tap');
          setCardPin('');
          setGasRewardWalletId('');
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ textAlign: 'center', color: '#0ea5e9', margin: 0 }}>
            {total.toLocaleString()} RWF
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {itemCount} items (incl. 18% VAT: {taxAmount.toLocaleString()} RWF)
          </Text>
        </div>

        {/* Payment Method Selection */}
        <Radio.Group
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setCardStep('tap');
            setCardPin('');
            setGasRewardWalletId('');
          }}
          style={{ width: '100%', marginBottom: 24 }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Button value="cash" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <DollarOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Cash Payment</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Pay with cash & calculate change</div>
                </div>
              </Space>
            </Radio.Button>
            <Radio.Button value="bigshop_card" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <CreditCardOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Big Shop Card</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Tap card, enter PIN, pay with wallet</div>
                </div>
              </Space>
            </Radio.Button>
            <Radio.Button value="momo" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <MobileOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>MTN Mobile Money</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>MTN MoMo or Airtel Money</div>
                </div>
              </Space>
            </Radio.Button>
            <Radio.Button value="airtel" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <MobileOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Airtel Money</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>MTN MoMo or Airtel Money</div>
                </div>
              </Space>
            </Radio.Button>
          </Space>
        </Radio.Group>

        <Divider style={{ margin: '16px 0' }} />

        {/* Big Shop Card Payment Flow */}
        {paymentMethod === 'bigshop_card' && (
          <div>
            {cardStep === 'tap' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CreditCardOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Tap Customer Card on Reader</Title>
                <Text type="secondary">Ask customer to tap their Big Shop Card on the NFC reader</Text>

                <div style={{ marginTop: 24, maxWidth: 300, margin: '24px auto 0' }}>
                  <Input
                    placeholder="Capture Card UID"
                    value={cardUid}
                    autoFocus
                    onChange={(e) => setCardUid(e.target.value)}
                    onPressEnter={() => {
                      if (cardUid) {
                        setCardStep('pin');
                        message.success('Card captured!');
                      }
                    }}
                    prefix={<CreditCardOutlined />}
                    size="large"
                    maxLength={50}
                    style={{ textAlign: 'center' }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    block
                    style={{ marginTop: 16 }}
                    disabled={!cardUid}
                    onClick={() => setCardStep('pin')}
                  >
                    Continue to PIN
                  </Button>
                </div>
              </div>
            )}

            {cardStep === 'pin' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Enter Card PIN</Title>
                <Input.Password
                  size="large"
                  placeholder="Enter 4-digit PIN"
                  value={cardPin}
                  onChange={(e) => setCardPin(e.target.value)}
                  onPressEnter={() => {
                    if (cardPin.length === 4) setCardStep('wallet_choice');
                  }}
                  autoFocus
                  maxLength={4}
                  style={{ textAlign: 'center', letterSpacing: 8, fontSize: 24 }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  disabled={cardPin.length !== 4}
                  onClick={() => setCardStep('wallet_choice')}
                >
                  Verify PIN
                </Button>
              </div>
            )}

            {cardStep === 'wallet_choice' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Select Payment Wallet</Title>
                <Radio.Group
                  value={cardWalletType}
                  onChange={(e) => setCardWalletType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio.Button value="dashboard" style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                      <Space>
                        <WalletOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>Dashboard Wallet</div>
                          <div style={{ fontSize: 11, color: '#52c41a' }}>Eligible for gas rewards</div>
                        </div>
                      </Space>
                    </Radio.Button>
                    <Radio.Button value="credit" style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                      <Space>
                        <CreditCardOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>Credit Wallet</div>
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>No gas rewards</div>
                        </div>
                      </Space>
                    </Radio.Button>
                  </Space>
                </Radio.Group>
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    if (cardWalletType === 'dashboard' && paymentMethod !== 'bigshop_card') {
                      setCardStep('reward_id');
                    } else {
                      // For card payments or credit wallet, proceed directly to payment
                      handlePayment();
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {cardStep === 'reward_id' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Enter Gas Reward Wallet ID</Title>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
                  Optional for Gas Rewards (Dashboard Wallet)
                </Text>
                <Input
                  size="large"
                  placeholder="Gas Reward Wallet ID (Optional)"
                  value={gasRewardWalletId}
                  onChange={(e) => setGasRewardWalletId(e.target.value)}
                  style={{ textAlign: 'center' }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  disabled={false}
                  onClick={handlePayment}
                >
                  Complete Payment
                </Button>
                <Button
                  type="text"
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => setCardStep('wallet_choice')}
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Money Payment Flow */}
        {(paymentMethod === 'momo' || paymentMethod === 'airtel') && (
          <div style={{ padding: '20px 0' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Select Mobile Money Provider</Title>
            <Radio.Group
              value={mobileProvider}
              onChange={(e) => setMobileProvider(e.target.value)}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Space style={{ width: '100%' }}>
                <Radio.Button value="mtn" style={{ flex: 1, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#faad14' }}>MTN MoMo</span>
                </Radio.Button>
                <Radio.Button value="airtel" style={{ flex: 1, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#f5222d' }}>Airtel Money</span>
                </Radio.Button>
              </Space>
            </Radio.Group>

            <Input
              size="large"
              placeholder="Customer phone number (07XXXXXXXX)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              prefix={<MobileOutlined />}
              style={{ marginBottom: 12 }}
            />

            <Input
              size="large"
              placeholder="Gas Reward Wallet ID (Phone Number - Optional)"
              value={gasRewardWalletId}
              onChange={(e) => setGasRewardWalletId(e.target.value)}
              prefix={<span style={{ color: '#fa541c' }}>🎁</span>}
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
              Payment request will be sent to customer's phone
            </Text>

            <Button
              type="primary"
              size="large"
              block
              loading={processing}
              disabled={!customerPhone || customerPhone.length < 10}
              onClick={handlePayment}
            >
              {processing ? 'Sending Payment Request...' : `Request ${total.toLocaleString()} RWF`}
            </Button>
          </div>
        )}

        {/* Cash Payment Flow */}
        {paymentMethod === 'cash' && (
          <div>
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 14, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Amount Due
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#389e0d', marginTop: 2 }}>
                {total.toLocaleString()} RWF
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Cash Tendered (Received):</Text>
              <InputNumber
                size="large"
                style={{ width: '100%', fontSize: 18 }}
                min={0}
                value={cashTendered || total}
                onChange={(val) => setCashTendered(val || 0)}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </div>

            {/* Quick cash shortcuts */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => setCashTendered(total)}>Exact</Button>
              <Button size="small" onClick={() => setCashTendered(Math.ceil(total / 500) * 500)}>Round 500</Button>
              <Button size="small" onClick={() => setCashTendered(Math.ceil(total / 1000) * 1000)}>Round 1,000</Button>
              <Button size="small" onClick={() => setCashTendered(Math.ceil(total / 5000) * 5000)}>Round 5,000</Button>
            </div>

            <div style={{ background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Text type="secondary" style={{ fontSize: 13 }}>Change to Return:</Text>
                <Text strong style={{ fontSize: 18, color: (cashTendered || total) >= total ? '#52c41a' : '#f5222d' }}>
                  {Math.max(0, (cashTendered || total) - total).toLocaleString()} RWF
                </Text>
              </Row>
              {(cashTendered || total) < total && (
                <Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  Warning: Amount tendered is less than total due.
                </Text>
              )}
            </div>

            <Input
              size="large"
              placeholder="Gas Reward Wallet ID (Optional)"
              value={gasRewardWalletId}
              onChange={(e) => setGasRewardWalletId(e.target.value)}
              prefix={<span style={{ color: '#fa541c' }}>🎁</span>}
              style={{ marginBottom: 16 }}
            />

            <Button
              type="primary"
              size="large"
              block
              loading={processing}
              disabled={(cashTendered || total) < total}
              onClick={handlePayment}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              {processing ? 'Processing Sale...' : `Complete Cash Sale (${total.toLocaleString()} RWF)`}
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        title={null}
        open={receiptModal}
        onCancel={() => setReceiptModal(false)}
        footer={[
          <Button key="print" type="default" icon={<PrinterOutlined />} onClick={printReceipt} size="large">
            Print Receipt
          </Button>,
          <Button key="new" type="primary" onClick={() => setReceiptModal(false)} size="large">
            New Sale
          </Button>,
        ]}
        width={400}
        centered
        closable={false}
      >
        {lastSale && (
          <div style={{
            color: '#000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: 12,
            lineHeight: 1.35,
            padding: '4px 8px'
          }}>
            {/* Header / Branding matching physical slip */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <img
                src="/logo-big.png"
                alt="BIG"
                style={{
                  height: 42,
                  display: 'block',
                  margin: '0 auto 4px',
                  objectFit: 'contain'
                }}
              />
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#000',
                lineHeight: 1.15
              }}>
                Big Innovation Group Ltd
              </div>
              <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>
                Kigali, Rwanda | +250788541239 | info@big.co.rw
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
                Official Sales Receipt
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Meta Details */}
            <div style={{ fontSize: 11, marginBottom: 4 }}>
              <Row justify="space-between" style={{ marginBottom: 2 }}>
                <span style={{ color: '#333' }}>Receipt No:</span>
                <span style={{ fontWeight: 700 }}>
                  #{lastSale.sale?.id?.toString().padStart(6, '0') || 'N/A'}
                </span>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 2 }}>
                <span style={{ color: '#333' }}>Date:</span>
                <span>
                  {new Date(lastSale.sale?.createdAt || new Date()).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </Row>
              <Row justify="space-between">
                <span style={{ color: '#333' }}>Payment Method:</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {(lastSale.method || lastSale.sale?.paymentMethod || 'CASH').replace(/_/g, ' ')}
                </span>
              </Row>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Items Table Header */}
            <Row style={{ fontWeight: 700, fontSize: 10, paddingBottom: 4, borderBottom: '1px dashed #000' }}>
              <Col span={14}>ITEM<br />DESCRIPTION</Col>
              <Col span={3} style={{ textAlign: 'center' }}>QTY</Col>
              <Col span={7} style={{ textAlign: 'right' }}>PRICE</Col>
            </Row>

            {/* Items List */}
            <div style={{ margin: '4px 0' }}>
              {lastSale.items?.map((item: CartItem, index: number) => (
                <Row key={index} align="top" style={{ padding: '4px 0', fontSize: 11 }}>
                  <Col span={14}>
                    <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: 9, color: '#444' }}>Unit: {item.price?.toLocaleString()} RWF</div>
                  </Col>
                  <Col span={3} style={{ textAlign: 'center', fontWeight: 500 }}>{item.quantity}</Col>
                  <Col span={7} style={{ textAlign: 'right', fontWeight: 700 }}>
                    {(item.price * item.quantity).toLocaleString()}
                  </Col>
                </Row>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Totals Section */}
            <div style={{ fontSize: 11, marginBottom: 4 }}>
              <Row justify="space-between" style={{ marginBottom: 2 }}>
                <span style={{ color: '#333' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{lastSale.subtotal?.toLocaleString()} RWF</span>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 2 }}>
                <span style={{ color: '#333' }}>Tax (18% VAT Included)</span>
                <span>{lastSale.tax?.toLocaleString()} RWF</span>
              </Row>
              {lastSale.discount > 0 && (
                <Row justify="space-between" style={{ marginBottom: 2 }}>
                  <span style={{ color: '#333' }}>Discount</span>
                  <span>-{lastSale.discount?.toLocaleString()} RWF</span>
                </Row>
              )}
              {lastSale.cashReceived !== undefined && (
                <Row justify="space-between" style={{ marginBottom: 2 }}>
                  <span style={{ color: '#333' }}>Cash Received</span>
                  <span style={{ fontWeight: 600 }}>{lastSale.cashReceived?.toLocaleString()} RWF</span>
                </Row>
              )}
              {lastSale.change !== undefined && (
                <Row justify="space-between" style={{ marginBottom: 2 }}>
                  <span style={{ color: '#333' }}>Change Return</span>
                  <span style={{ fontWeight: 600 }}>{lastSale.change?.toLocaleString()} RWF</span>
                </Row>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Big Total Amount matching physical receipt (no blue box) */}
            <div style={{ textAlign: 'center', padding: '6px 0', margin: '4px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                TOTAL AMOUNT
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2, color: '#000' }}>
                {lastSale.total?.toLocaleString()} RWF
              </div>
            </div>

            {/* Rewards Info */}
            {lastSale.gasRewardWalletId && (
              <div style={{
                textAlign: 'center',
                padding: '4px',
                border: '1px dashed #666',
                margin: '8px 0',
                fontSize: 10
              }}>
                <span>Rewards linked to: </span>
                <span style={{ fontWeight: 700 }}>{lastSale.gasRewardWalletId}</span>
              </div>
            )}

            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 8, paddingBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>Thank you for shopping!</div>
              <div style={{ fontSize: 10, color: '#444' }}>For support: +250788541239 | info@big.co.rw</div>
              <div style={{ fontSize: 9, color: '#666', marginTop: 4, textTransform: 'uppercase' }}>
                PROCESSED BY Big Innovation Group Ltd
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Barcode Scan — Quantity Entry Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarcodeOutlined style={{ color: '#1890ff' }} />
            Product Found — Enter Quantity
          </span>
        }
        open={scanModal}
        onCancel={() => {
          setScanModal(false);
          setScannedProduct(null);
          setScanQuantity(1);
          barcodeInputRef.current?.focus();
        }}
        onOk={confirmScanAdd}
        okText="Add to Cart"
        okButtonProps={{ disabled: !scanQuantity || scanQuantity <= 0 }}
        cancelText="Cancel"
        width={420}
        centered
      >
        {scannedProduct && (
          <div>
            {/* Product Info */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {scannedProduct.image ? (
                  <img
                    src={scannedProduct.image}
                    alt={scannedProduct.name}
                    style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, background: '#e0f2fe',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <BarcodeOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{scannedProduct.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>SKU: {scannedProduct.sku}</div>
                  <div style={{ color: '#0ea5e9', fontWeight: 600, fontSize: 14 }}>
                    {scannedProduct.price?.toLocaleString()} RWF / unit
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    Stock available: <strong>{scannedProduct.stock}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Input */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
                Enter Quantity
              </div>
              <InputNumber
                autoFocus
                value={scanQuantity}
                min={scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters' ? 0.01 : 1}
                max={scannedProduct.stock}
                step={scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters' ? 0.25 : 1}
                precision={scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters' ? 2 : 0}
                onChange={(val) => setScanQuantity(val ?? 1)}
                onPressEnter={confirmScanAdd}
                style={{ width: '100%', fontSize: 18, height: 44 }}
                size="large"
                placeholder={scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters' ? "e.g. 0.5, 1, 2.25" : "e.g. 1, 2, 3"}
              />
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                {scannedProduct.unit?.toLowerCase() === 'kg' || scannedProduct.unit?.toLowerCase() === 'liters'
                  ? "Tip: You can enter decimal values like 0.5, 0.25, 1.5"
                  : "Tip: This product requires integer/whole-number quantities (e.g. 1, 2, 5)"}
              </div>
            </div>

            {/* Live Price Preview */}
            {scanQuantity > 0 && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#0ea5e9',
                borderRadius: 8,
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, opacity: 0.9 }}>
                  {scannedProduct.price?.toLocaleString()} × {scanQuantity}
                </span>
                <span style={{ fontWeight: 800, fontSize: 20 }}>
                  {(scannedProduct.price * (Math.round(scanQuantity * 100) / 100)).toLocaleString()} RWF
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default POSPage;
