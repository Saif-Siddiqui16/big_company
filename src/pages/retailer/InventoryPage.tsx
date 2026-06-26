import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Space,
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Row,
  Col,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Statistic,
  Descriptions,
  Badge,
  Alert,
  Tabs,
  Upload,
  Checkbox,
  List,
} from 'antd';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  WarningOutlined,
  AppstoreOutlined,
  DollarOutlined,
  InboxOutlined,
  BarcodeOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  low_stock_threshold: number;
  threshold?: number;  // API might return 'threshold' instead
  cost_price: number;
  cost?: number;  // API might return 'cost' instead
  selling_price: number;
  price?: number;  // API might return 'price' instead
  barcode?: string;
  image?: string;
  status: 'active' | 'inactive';
  unit?: string;
  baseUnit?: string;
  purchaseUnit?: string;
  conversionFactor?: number;
  created_at: string;
  updated_at: string;
}

interface InventoryStats {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories: number;
}

export const InventoryPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [profitMarginFilter, setProfitMarginFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Stock adjustment modal
  const [stockModal, setStockModal] = useState<{
    visible: boolean;
    product: Product | null;
    type: 'add' | 'remove' | 'set';
  }>({ visible: false, product: null, type: 'add' });
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockReason, setStockReason] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  // Price update modal
  const [priceModal, setPriceModal] = useState<{
    visible: boolean;
    product: Product | null;
  }>({ visible: false, product: null });
  const [newSellingPrice, setNewSellingPrice] = useState(0);
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  // Create product modal
  const [createModal, setCreateModal] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Barcode printing states
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcodeQuantities, setBarcodeQuantities] = useState<Record<string, number>>({});
  const [selectedBarcodeProductIds, setSelectedBarcodeProductIds] = useState<string[]>([]);
  const [barcodeExportFormat, setBarcodeExportFormat] = useState<'pdf' | 'csv'>('pdf');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, showLowStock, profitMarginFilter, pagination.current]);

  const loadCategories = async () => {
    try {
      const response = await retailerApi.getCategories();
      if (response.data && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await retailerApi.getProducts({
        category: categoryFilter || undefined,
        low_stock: showLowStock || undefined,
        search: searchTerm || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });

      const data = response.data;
      // Normalize API response fields (API returns 'price', 'cost', 'threshold' but we use longer names)
      let normalizedProducts = (data.products || []).map((p: any) => ({
        ...p,
        selling_price: p.selling_price || p.price || 0,
        cost_price: p.cost_price || p.cost || p.costPrice || 0,
        low_stock_threshold: p.low_stock_threshold || p.threshold || 10,
      }));

      // Apply profit margin filter (client-side)
      if (profitMarginFilter) {
        normalizedProducts = normalizedProducts.filter((p: Product) => {
          const margin = p.cost_price > 0
            ? ((p.selling_price - p.cost_price) / p.cost_price) * 100
            : 0;

          switch (profitMarginFilter) {
            case 'high': // > 20%
              return margin > 20;
            case 'medium': // 10-20%
              return margin >= 10 && margin <= 20;
            case 'low': // < 10%
              return margin < 10;
            default:
              return true;
          }
        });
      }

      setProducts(normalizedProducts);
      setPagination((prev) => ({ ...prev, total: data.total || data.count || 0 }));

      // Calculate stats using normalized products
      const allProducts = normalizedProducts;
      const totalValue = allProducts.reduce(
        (sum: number, p: Product) => sum + p.stock * (p.cost_price || 0),
        0
      );
      const uniqueCategories = new Set(allProducts.map((p: Product) => p.category));

      setStats({
        total_products: data.total || data.count || allProducts.length,
        total_value: totalValue,
        low_stock_count: allProducts.filter(
          (p: Product) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 10)
        ).length,
        out_of_stock_count: allProducts.filter((p: Product) => p.stock === 0).length,
        categories: uniqueCategories.size,
      });
    } catch (error: any) {
      console.error('Failed to load inventory:', error);
      message.error(`Failed to load inventory: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockModal.product) return;

    setStockLoading(true);
    try {
      await retailerApi.updateStock(
        stockModal.product.id,
        stockQuantity,
        stockModal.type,
        stockReason
      );

      message.success('Stock updated successfully');
      setStockModal({ visible: false, product: null, type: 'add' });
      setStockQuantity(0);
      setStockReason('');
      loadProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update stock');
    } finally {
      setStockLoading(false);
    }
  };

  const handlePriceUpdate = async () => {
    if (!priceModal.product) return;

    setPriceLoading(true);
    try {
      await retailerApi.updatePrice(priceModal.product.id, newSellingPrice, newCostPrice);

      message.success('Prices updated successfully');
      setPriceModal({ visible: false, product: null });
      loadProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update prices');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleCreateProduct = async (values: any) => {
    setCreateLoading(true);
    try {
      // Map form values to backend expectations
      const payload: any = values.entry_type === 'manual' 
        ? {
            name: values.name,
            category: values.category,
            price: values.selling_price, // Backend expects 'price' as selling price
            costPrice: values.cost_price,
            stock: values.stock,
            sku: values.sku,
            baseUnit: values.baseUnit,
            purchaseUnit: values.purchaseUnit,
            conversionFactor: values.conversionFactor,
            taxType: values.taxType
          }
        : {
            invoice_number: values.invoice_number
          };

      // Add image to payload if available
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const base64 = await getBase64(fileList[0].originFileObj);
        payload.image = base64;
      }

      await retailerApi.createProduct(payload);

      message.success('Product created successfully');
      setCreateModal(false);
      createForm.resetFields();
      setFileList([]);
      loadProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create product');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExportBarcodes = () => {
    const selectedProducts = products.filter(p => selectedBarcodeProductIds.includes(p.id));
    if (selectedProducts.length === 0) {
      message.warning('Please select at least one product');
      return;
    }

    if (barcodeExportFormat === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Product Name,SKU,Barcode,Selling Price,Unit of Measure\n";
      
      selectedProducts.forEach(p => {
        const qty = barcodeQuantities[p.id] || 1;
        const barcodeVal = p.barcode || p.sku || 'N/A';
        for (let i = 0; i < qty; i++) {
          csvContent += `"${p.name}","${p.sku}","${barcodeVal}","${p.selling_price}","${p.unit || 'units'}"\n`;
        }
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `barcodes_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('CSV downloaded successfully!');
      setBarcodeModalVisible(false);
    } else {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const cardWidth = 60;
      const cardHeight = 25;
      const startX = 10;
      const startY = 15;
      const gapX = 5;
      const gapY = 3;

      let currentX = startX;
      let currentY = startY;
      let col = 0;
      let row = 0;

      const canvas = document.createElement('canvas');
      let hasAddedLabels = false;

      selectedProducts.forEach(p => {
        const qty = barcodeQuantities[p.id] || 1;
        const barcodeVal = p.barcode || p.sku || 'N/A';

        try {
          JsBarcode(canvas, barcodeVal, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 16
          });
          const imgData = canvas.toDataURL('image/png');

          for (let i = 0; i < qty; i++) {
            hasAddedLabels = true;
            if (row >= 10) {
              doc.addPage();
              row = 0;
              col = 0;
              currentX = startX;
              currentY = startY;
            }

            doc.rect(currentX, currentY, cardWidth, cardHeight);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            const truncatedName = p.name.length > 28 ? p.name.substring(0, 25) + '...' : p.name;
            doc.text(truncatedName, currentX + 3, currentY + 4);

            doc.addImage(imgData, 'PNG', currentX + 3, currentY + 6, cardWidth - 6, cardHeight - 12);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`SKU: ${p.sku || 'N/A'}`, currentX + 3, currentY + cardHeight - 2);
            doc.setFont('helvetica', 'bold');
            doc.text(`${p.selling_price?.toLocaleString()} RWF`, currentX + cardWidth - 22, currentY + cardHeight - 2);

            col++;
            if (col >= 3) {
              col = 0;
              row++;
              currentX = startX;
              currentY = currentY + cardHeight + gapY;
            } else {
              currentX = currentX + cardWidth + gapX;
            }
          }
        } catch (err) {
          console.error(`Failed to generate barcode for ${p.name}:`, err);
        }
      });

      if (hasAddedLabels) {
        doc.save(`barcodes_${Date.now()}.pdf`);
        message.success('PDF labels downloaded successfully!');
        setBarcodeModalVisible(false);
      } else {
        message.error('No barcodes could be generated.');
      }
    }
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { color: 'red', text: 'Out of Stock', status: 'exception' as const };
    if (stock <= threshold) return { color: 'orange', text: 'Low Stock', status: 'normal' as const };
    return { color: 'green', text: 'In Stock', status: 'success' as const };
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.image ? (
            <img
              src={record.image}
              alt={record.name}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                background: '#f0f0f0',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <InboxOutlined style={{ color: '#999' }} />
            </div>
          )}
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              SKU: {record.sku}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (value: string) => <Tag>{value}</Tag>,
      filters: categories.map((c) => ({ text: c, value: c })),
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_: any, record: Product) => {
        const status = getStockStatus(record.stock, record.low_stock_threshold);
        const percentage = Math.min((record.stock / (record.low_stock_threshold * 2)) * 100, 100);
        
        const conversionFactor = (record as any).conversionFactor;
        const purchaseUnit = (record as any).purchaseUnit;
        const baseUnit = (record as any).baseUnit;
        
        let stockLabel = `${record.stock} ${record.unit || 'units'}`;
        if (conversionFactor && conversionFactor > 0) {
          const purchaseQty = record.stock / conversionFactor;
          stockLabel = `${record.stock} ${baseUnit || 'units'} (${purchaseQty} ${purchaseUnit || 'sacks'})`;
        }

        return (
          <div style={{ width: 220 }}>
            <Progress
              percent={percentage}
              size="small"
              status={status.status}
              format={() => stockLabel}
            />
          </div>
        );
      },
      sorter: (a: Product, b: Product) => a.stock - b.stock,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Product) => {
        const status = getStockStatus(record.stock, record.low_stock_threshold);
        return (
          <Badge
            status={status.status === 'exception' ? 'error' : status.status === 'normal' ? 'warning' : 'success'}
            text={<Tag color={status.color}>{status.text}</Tag>}
          />
        );
      },
      filters: [
        { text: 'In Stock', value: 'in_stock' },
        { text: 'Low Stock', value: 'low_stock' },
        { text: 'Out of Stock', value: 'out_of_stock' },
      ],
    },
    {
      title: 'Cost Price',
      dataIndex: 'cost_price',
      key: 'cost_price',
      render: (value: number) => `${value?.toLocaleString()} RWF`,
      sorter: (a: Product, b: Product) => a.cost_price - b.cost_price,
    },
    {
      title: 'Selling Price',
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (value: number) => (
        <Text strong style={{ color: '#0ea5e9' }}>{value?.toLocaleString()} RWF</Text>
      ),
      sorter: (a: Product, b: Product) => a.selling_price - b.selling_price,
    },
    {
      title: 'Margin',
      key: 'margin',
      render: (_: any, record: Product) => {
        const margin = record.cost_price > 0
          ? ((record.selling_price - record.cost_price) / record.cost_price) * 100
          : 0;
        return (
          <Text style={{ color: margin >= 20 ? '#52c41a' : margin >= 10 ? '#faad14' : '#ff4d4f' }}>
            {margin.toFixed(1)}%
          </Text>
        );
      },
    },
    {
      title: 'Barcode',
      key: 'barcode_actions',
      render: (_: any, record: Product) => (
        <Button
          size="small"
          icon={<BarcodeOutlined />}
          onClick={() => {
            setSelectedBarcodeProductIds([record.id]);
            setBarcodeQuantities({ [record.id]: 1 });
            setBarcodeModalVisible(true);
          }}
        >
          Print Label
        </Button>
      ),
    },
    // Actions column removed - Only admin can modify inventory
    // Retailers can only add products via wholesaler invoice
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Inventory</Title>
        <Space>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadProducts(true)}
          >
            Refresh
          </Button>
          <Button
            icon={<BarcodeOutlined />}
            onClick={() => {
              setSelectedBarcodeProductIds(products.map(p => p.id));
              const initialQuantities: Record<string, number> = {};
              products.forEach(p => {
                initialQuantities[p.id] = 1;
              });
              setBarcodeQuantities(initialQuantities);
              setBarcodeModalVisible(true);
            }}
          >
            Print Barcodes
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
          >
            Add from Invoice
          </Button>
        </Space>
      </Row>

      {/* Info Alert - Admin Only Modifications */}
      <Alert
        message="Inventory Management"
        description="Your inventory is automatically updated when wholesaler orders are confirmed. Only admin can modify product prices. To add new products, enter the invoice number from your wholesaler order."
        type="info"
        showIcon
        icon={<InboxOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Stats Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={5}>
            <Card size="small">
              <Statistic
                title="Total Products"
                value={stats.total_products}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card size="small">
              <Statistic
                title="Inventory Value"
                value={stats.total_value}
                suffix="RWF"
                valueStyle={{ fontSize: '18px' }}
                prefix={<DollarOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card size="small">
              <Statistic
                title="Low Stock"
                value={stats.low_stock_count}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card size="small">
              <Statistic
                title="Out of Stock"
                value={stats.out_of_stock_count}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small">
              <Statistic
                title="Categories"
                value={stats.categories}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={() => loadProducts()}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="">All Categories</Select.Option>
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Profit Margin"
              value={profitMarginFilter}
              onChange={setProfitMarginFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="">All Margins</Select.Option>
              <Select.Option value="high">High (&gt; 20%)</Select.Option>
              <Select.Option value="medium">Medium (10-20%)</Select.Option>
              <Select.Option value="low">Low (&lt; 10%)</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type={showLowStock ? 'primary' : 'default'}
              danger={showLowStock}
              icon={<WarningOutlined />}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              Low Stock Only
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} products`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) =>
            record.stock === 0
              ? 'ant-table-row-out-of-stock'
              : record.stock <= record.low_stock_threshold
              ? 'ant-table-row-low-stock'
              : ''
          }
        />
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        title={`${stockModal.type === 'add' ? 'Add' : stockModal.type === 'remove' ? 'Remove' : 'Set'} Stock`}
        open={stockModal.visible}
        onCancel={() => {
          setStockModal({ visible: false, product: null, type: 'add' });
          setStockQuantity(0);
          setStockReason('');
        }}
        onOk={handleStockUpdate}
        confirmLoading={stockLoading}
      >
        {stockModal.product && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Product">{stockModal.product.name}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">
                <Tag color={stockModal.product.stock > 0 ? 'blue' : 'red'}>
                  {stockModal.product.stock} units
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="Quantity" required>
                <InputNumber
                  value={stockQuantity}
                  onChange={(val) => setStockQuantity(val || 0)}
                  min={0}
                  max={stockModal.type === 'remove' ? stockModal.product.stock : 99999}
                  style={{ width: '100%' }}
                  placeholder="Enter quantity"
                />
              </Form.Item>
              <Form.Item label="Reason">
                <Input.TextArea
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g., New shipment, Damaged goods, Inventory count..."
                  rows={2}
                />
              </Form.Item>

              {stockQuantity > 0 && (
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Text>
                    New Stock:{' '}
                    <Text strong>
                      {stockModal.type === 'add'
                        ? stockModal.product.stock + stockQuantity
                        : stockModal.type === 'remove'
                        ? stockModal.product.stock - stockQuantity
                        : stockQuantity}{' '}
                      units
                    </Text>
                  </Text>
                </div>
              )}
            </Form>
          </>
        )}
      </Modal>

      {/* Price Update Modal */}
      <Modal
        title="Update Prices"
        open={priceModal.visible}
        onCancel={() => setPriceModal({ visible: false, product: null })}
        onOk={handlePriceUpdate}
        confirmLoading={priceLoading}
      >
        {priceModal.product && (
          <Form layout="vertical">
            <div style={{ marginBottom: 16 }}>
              <Text strong>{priceModal.product.name}</Text>
            </div>

            <Form.Item label="Cost Price (RWF)">
              <InputNumber
                value={newCostPrice}
                onChange={(val) => setNewCostPrice(val || 0)}
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
              />
            </Form.Item>
            <Form.Item label="Selling Price (RWF)">
              <InputNumber
                value={newSellingPrice}
                onChange={(val) => setNewSellingPrice(val || 0)}
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0')}
              />
            </Form.Item>

            {newCostPrice > 0 && newSellingPrice > 0 && (
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                <Row justify="space-between">
                  <Text>Profit Margin:</Text>
                  <Text
                    strong
                    style={{
                      color: ((newSellingPrice - newCostPrice) / newCostPrice) * 100 >= 15
                        ? '#52c41a'
                        : '#faad14',
                    }}
                  >
                    {(((newSellingPrice - newCostPrice) / newCostPrice) * 100).toFixed(1)}%
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text>Profit per unit:</Text>
                  <Text strong>{(newSellingPrice - newCostPrice).toLocaleString()} RWF</Text>
                </Row>
              </div>
            )}
          </Form>
        )}
      </Modal>

      {/* Add Product Modal */}
      <Modal
        title="Add Product"
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={createLoading}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateProduct}
          initialValues={{ entry_type: 'invoice' }}
        >
          <Form.Item name="entry_type" noStyle>
            <Input type="hidden" />
          </Form.Item>

          <Tabs
            defaultActiveKey="invoice"
            onChange={(key) => createForm.setFieldsValue({ entry_type: key })}
            items={[
              {
                key: 'invoice',
                label: 'Import from Invoice',
                children: (
                  <>
                    <Alert
                      message="Invoice-Based Inventory Update"
                      description="Enter the invoice number from your wholesaler order to automatically import verified products."
                      type="info"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    <Form.Item
                      name="invoice_number"
                      label="Invoice Number"
                      rules={[{ required: createForm.getFieldValue('entry_type') === 'invoice', message: 'Please enter the invoice number' }]}
                    >
                      <Input
                        placeholder="e.g., INV-2024-001234"
                        prefix={<BarcodeOutlined />}
                        size="large"
                      />
                    </Form.Item>
                    <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>Note:</strong> Items are imported with wholesaler prices. You can adjust selling prices afterwards.
                      </Text>
                    </div>
                  </>
                ),
              },
              {
                key: 'manual',
                label: 'Manual Entry',
                children: (
                  <>
                    <Alert
                      message="Manual Product Entry"
                      description="Use this for products from local suppliers or existing stock without a digital invoice."
                      type="warning"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item
                          name="name"
                          label="Product Name"
                          rules={[{ required: createForm.getFieldValue('entry_type') === 'manual', message: 'Name is required' }]}
                        >
                          <Input placeholder="e.g. Local Rice 1kg" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="category"
                          label="Category"
                          rules={[{ required: createForm.getFieldValue('entry_type') === 'manual', message: 'Category is required' }]}
                        >
                          <Select placeholder="Select">
                            {categories.map((c) => (
                              <Select.Option key={c} value={c}>{c}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                      <Col span={8}>
                         <Form.Item name="selling_price" label="Selling Price" rules={[{ required: createForm.getFieldValue('entry_type') === 'manual', message: 'Required' }]}>
                           <InputNumber style={{ width: '100%' }} min={0} placeholder="RWF" />
                         </Form.Item>
                      </Col>
                      <Col span={8}>
                         <Form.Item name="cost_price" label="Cost Price">
                           <InputNumber style={{ width: '100%' }} min={0} placeholder="RWF" />
                         </Form.Item>
                      </Col>
                      <Col span={8}>
                         <Form.Item name="stock" label="Initial Stock">
                           <InputNumber style={{ width: '100%' }} min={0} placeholder="Qty" />
                         </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="sku" label="SKU / Barcode (Optional)">
                      <Input placeholder="Scan or type code" prefix={<BarcodeOutlined />} />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={8}>
                         <Form.Item name="purchaseUnit" label="Purchase Unit">
                           <Input placeholder="e.g. Sack, Carton" />
                         </Form.Item>
                      </Col>
                      <Col span={8}>
                         <Form.Item name="baseUnit" label="Base Unit">
                           <Input placeholder="e.g. kg, piece" />
                         </Form.Item>
                      </Col>
                      <Col span={8}>
                         <Form.Item name="conversionFactor" label="Conversion Factor">
                           <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 25" />
                         </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="taxType" label="Tax Category" initialValue="B">
                      <Select>
                        <Select.Option value="A">Type A (Exempted)</Select.Option>
                        <Select.Option value="B">Type B (Standard 18% VAT)</Select.Option>
                        <Select.Option value="C">Type C (Zero-Rated)</Select.Option>
                        <Select.Option value="D">Type D (Luxury / Compounded)</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Product Image">
                      <Upload.Dragger
                        listType="picture"
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setFileList(fileList.slice(-1))}
                        maxCount={1}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag image to this area to upload</p>
                      </Upload.Dragger>
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Barcode Printing Modal */}
      <Modal
        title="Print Barcode Labels"
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        onOk={handleExportBarcodes}
        okText="Download / Export"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Select products and input the quantity of labels you wish to generate. You can export as a PDF label sheet (grid layout) or a CSV details sheet.
          </Text>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text strong>Export Format:</Text>
          <Select
            value={barcodeExportFormat}
            onChange={(val) => setBarcodeExportFormat(val)}
            style={{ width: 250 }}
          >
            <Select.Option value="pdf">PDF Label Sheet (Printable)</Select.Option>
            <Select.Option value="csv">CSV Spreadsheet</Select.Option>
          </Select>
        </div>

        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, maxHeight: 350, overflow: 'auto' }}>
          <List
            dataSource={products}
            renderItem={(product) => {
              const isSelected = selectedBarcodeProductIds.includes(product.id);
              const qty = barcodeQuantities[product.id] || 1;
              return (
                <List.Item
                  actions={[
                    isSelected && (
                      <div key="qty" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12 }}>Labels Needed:</Text>
                        <InputNumber
                          min={1}
                          max={100}
                          value={qty}
                          onChange={(val) => {
                            setBarcodeQuantities(prev => ({
                              ...prev,
                              [product.id]: val || 1
                            }));
                          }}
                          style={{ width: 70 }}
                        />
                      </div>
                    )
                  ]}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBarcodeProductIds(prev => [...prev, product.id]);
                        if (!barcodeQuantities[product.id]) {
                          setBarcodeQuantities(prev => ({ ...prev, [product.id]: 1 }));
                        }
                      } else {
                        setSelectedBarcodeProductIds(prev => prev.filter(id => id !== product.id));
                      }
                    }}
                  >
                    <div style={{ marginLeft: 8 }}>
                      <Text strong>{product.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SKU: {product.sku} | Barcode: {product.barcode || product.sku || 'N/A'} | Price: {product.selling_price?.toLocaleString()} RWF
                      </Text>
                    </div>
                  </Checkbox>
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>

      <style>{`
        .ant-table-row-out-of-stock {
          background-color: #fff1f0;
        }
        .ant-table-row-out-of-stock:hover > td {
          background-color: #ffccc7 !important;
        }
        .ant-table-row-low-stock {
          background-color: #fff7e6;
        }
        .ant-table-row-low-stock:hover > td {
          background-color: #fff1b8 !important;
        }
      `}</style>
    </div>
  );
};

// Helper function to convert file to base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default InventoryPage;
