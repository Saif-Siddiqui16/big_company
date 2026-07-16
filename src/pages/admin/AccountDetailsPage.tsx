import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Tabs,
  Table,
  Statistic,
  Spin,
  message,
  Button,
  Space,
  Descriptions,
  Timeline,
  Badge,
  Alert,
  Divider,
  List,
  Avatar,
  Progress,
  Steps,
  Modal,
  Pagination,
  Input,
  InputNumber,
  Select,
  Form,
  Checkbox,
  Popconfirm,
  Upload,
} from 'antd';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import {
  UserOutlined,
  WalletOutlined,
  AppstoreOutlined,
  WarningOutlined,
  BarcodeOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  FireOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  InboxOutlined,
  ShopOutlined,
  TeamOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  DollarOutlined,
  IdcardOutlined,
  TruckOutlined,
  EyeOutlined,
  CarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  PrinterOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { adminApi, retailerApi } from '../../services/apiService';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

type AccountType = 'customer' | 'retailer' | 'worker' | 'wholesaler';

const AccountDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountType = searchParams.get('type') as AccountType || 'customer';

  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Wholesale stock order modal (admin retailer view)
  const [selectedStockOrder, setSelectedStockOrder] = useState<any>(null);
  const [showStockOrderModal, setShowStockOrderModal] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatus, setSalesStatus] = useState('');
  const [salesPayment, setSalesPayment] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('orders');

  // Barcode printing states
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcodeQuantities, setBarcodeQuantities] = useState<Record<string, number>>({});
  const [selectedBarcodeProductIds, setSelectedBarcodeProductIds] = useState<string[]>([]);
  const [barcodeExportFormat, setBarcodeExportFormat] = useState<'pdf' | 'csv'>('pdf');

  // Sales action modal states (retailer orders)
  const [salesActionModal, setSalesActionModal] = useState<{
    visible: boolean;
    order: any;
    action: 'accept' | 'reject' | 'ready' | 'complete' | 'cancel' | 'ship' | null;
  }>({ visible: false, order: null, action: null });
  const [salesActionLoading, setSalesActionLoading] = useState(false);
  const [salesActionNotes, setSalesActionNotes] = useState('');
  const [salesShipperName, setSalesShipperName] = useState('');
  const [salesShipperPhone, setSalesShipperPhone] = useState('');
  const [salesVehiclePlate, setSalesVehiclePlate] = useState('');

  // ── Wholesaler order modal states (admin view of wholesaler orders) ──
  const [wsOrderStatusFilter, setWsOrderStatusFilter] = useState('');
  const [wsOrderPaymentFilter, setWsOrderPaymentFilter] = useState('');
  const [wsConfirmModalOpen, setWsConfirmModalOpen] = useState(false);
  const [wsRejectModalOpen, setWsRejectModalOpen] = useState(false);
  const [wsShipModalOpen, setWsShipModalOpen] = useState(false);
  const [wsDetailModalOpen, setWsDetailModalOpen] = useState(false);
  const [wsSelectedOrder, setWsSelectedOrder] = useState<any>(null);
  const [wsActionLoading, setWsActionLoading] = useState(false);
  const [wsForm] = Form.useForm();

  // ── Wholesaler inventory modal states (admin view of wholesaler inventory) ──
  const [wsInvSearchQuery, setWsInvSearchQuery] = useState('');
  const [wsInvCategoryFilter, setWsInvCategoryFilter] = useState('');
  const [wsInvLowStockFilter, setWsInvLowStockFilter] = useState(false);
  const [wsEditModalOpen, setWsEditModalOpen] = useState(false);
  const [wsStockModalOpen, setWsStockModalOpen] = useState(false);
  const [wsSelectedProduct, setWsSelectedProduct] = useState<any>(null);
  const [wsInvForm] = Form.useForm();
  const [wsInvActionLoading, setWsInvActionLoading] = useState(false);
  const [wsFileList, setWsFileList] = useState<any[]>([]);

  const handleSalesAction = async () => {
    if (!salesActionModal.order || !salesActionModal.action) return;
    setSalesActionLoading(true);
    try {
      const { order, action } = salesActionModal;
      switch (action) {
        case 'accept':
          await retailerApi.updateOrderStatus(order.id, 'processing', { notes: salesActionNotes });
          message.success('Order accepted');
          break;
        case 'reject':
        case 'cancel':
          if (!salesActionNotes.trim()) {
            message.error('Please provide a reason');
            setSalesActionLoading(false);
            return;
          }
          await retailerApi.cancelOrder(order.id, salesActionNotes);
          message.success('Order cancelled');
          break;
        case 'ready':
          await retailerApi.updateOrderStatus(order.id, 'ready', { notes: salesActionNotes });
          message.success('Order marked as ready');
          break;
        case 'ship':
          if (!salesShipperName || !salesShipperPhone || !salesVehiclePlate) {
            message.error('Please provide all shipper details');
            setSalesActionLoading(false);
            return;
          }
          await retailerApi.updateOrderStatus(order.id, 'shipped', {
            shipperName: salesShipperName,
            shipperPhone: salesShipperPhone,
            vehiclePlate: salesVehiclePlate,
            notes: salesActionNotes
          });
          message.success('Order marked as shipped');
          break;
        case 'complete':
          await retailerApi.fulfillOrder(order.id);
          message.success('Order completed');
          break;
      }
      setSalesActionModal({ visible: false, order: null, action: null });
      setSalesActionNotes('');
      setSalesShipperName('');
      setSalesShipperPhone('');
      setSalesVehiclePlate('');
      fetchAccountDetails();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Action failed');
    } finally {
      setSalesActionLoading(false);
    }
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { color: 'red', text: 'Out of Stock', status: 'exception' as const };
    if (stock <= threshold) return { color: 'orange', text: 'Low Stock', status: 'normal' as const };
    return { color: 'green', text: 'In Stock', status: 'success' as const };
  };

  const handleExportBarcodes = () => {
    const products = accountData?.products || [];
    const selectedProducts = products.filter((p: any) => selectedBarcodeProductIds.includes(p.id));
    if (selectedProducts.length === 0) {
      message.warning('Please select at least one product');
      return;
    }

    if (barcodeExportFormat === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Product Name,SKU,Barcode,Selling Price,Unit of Measure\n";
      
      selectedProducts.forEach((p: any) => {
        const qty = barcodeQuantities[p.id] || 1;
        const barcodeVal = p.barcode || p.sku || 'N/A';
        for (let i = 0; i < qty; i++) {
          const sellingPrice = p.retailerPrice || p.price || 0;
          csvContent += `"${p.name}","${p.sku}","${barcodeVal}","${sellingPrice}","${p.unit || 'units'}"\n`;
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

      selectedProducts.forEach((p: any) => {
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
            const sellingPrice = p.retailerPrice || p.price || 0;
            doc.text(`${sellingPrice?.toLocaleString()} RWF`, currentX + cardWidth - 22, currentY + cardHeight - 2);

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

  const orderStatusColors: Record<string, string> = {
    pending: 'gold',
    confirmed: 'blue',
    processing: 'blue',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
    rejected: 'red'
  };

  const orderStatusLabels: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'PROCEED',
    processing: 'PROCEED',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
    rejected: 'REJECTED'
  };

  const getOrderStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
    return steps.indexOf(status?.toLowerCase());
  };

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id, accountType]);

  const fetchAccountDetails = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    try {
      let response;
      switch (accountType) {
        case 'customer':
          response = await adminApi.getCustomerAccountDetails(id!);
          break;
        case 'retailer':
          response = await adminApi.getRetailerAccountDetails(id!);
          break;
        case 'worker':
          response = await adminApi.getWorkerAccountDetails(id!);
          break;
        case 'wholesaler':
          response = await adminApi.getWholesalerAccountDetails(id!);
          break;
        default:
          throw new Error('Invalid account type');
      }
      setAccountData(response.data.accountDetails);
    } catch (error: any) {
      console.error('Error fetching account details:', error);
      message.error('Failed to fetch account details');
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccountDetails(true);
    setRefreshing(false);
    message.success('Data refreshed');
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const response = await adminApi.confirmDelivery(orderId);
      if (response.data.success) {
        message.success('Delivery confirmed successfully');
        fetchAccountDetails();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to confirm delivery');
    }
  };

  const handleConfirmWholesaleDelivery = async (orderId: string) => {
    try {
      const response = await adminApi.confirmWholesaleDelivery(orderId);
      if (response.data.success) {
        message.success('Wholesale delivery confirmed successfully');
        fetchAccountDetails();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to confirm wholesale delivery');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', icon: <ClockCircleOutlined /> },
      active: { color: 'blue', icon: <CheckCircleOutlined /> },
      completed: { color: 'green', icon: <CheckCircleOutlined /> },
      delivered: { color: 'green', icon: <CheckCircleOutlined /> },
      shipped: { color: 'purple', icon: <TruckOutlined /> },
      cancelled: { color: 'red', icon: <CloseCircleOutlined /> },
      processing: { color: 'blue', icon: <ClockCircleOutlined /> },
    };
    const config = statusConfig[status?.toLowerCase()] || { color: 'default', icon: null };
    const label = (status?.toLowerCase() === 'confirmed' || status?.toLowerCase() === 'processing') ? 'PROCEED' : status?.toUpperCase();
    return <Tag color={config.color} icon={config.icon}>{label}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading account details...</div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <Alert
        message="Account Not Found"
        description="The requested account could not be found."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        }
      />
    );
  }

  const renderCustomerAccount = () => (
    <>
      {/* Wallet Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Dashboard Wallet"
              value={accountData.walletSummary?.dashboardWallet || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              suffix="RWF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Credit Wallet"
              value={accountData.walletSummary?.creditWallet || 0}
              prefix={<CreditCardOutlined style={{ color: '#722ed1' }} />}
              suffix="RWF"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Gas Reward Wallet"
              value={Number(accountData.walletSummary?.gasRewardsWallet || 0).toFixed(4)}
              prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
              suffix="M³"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Order Statistics */}
      <Card title="Order Statistics" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={8} sm={4}>
            <Statistic title="Pending" value={accountData.orderStats?.pending || 0} valueStyle={{ color: '#faad14' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Active" value={accountData.orderStats?.active || 0} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Completed" value={accountData.orderStats?.completed || 0} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Cancelled" value={accountData.orderStats?.cancelled || 0} valueStyle={{ color: '#f5222d' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Total" value={accountData.orderStats?.total || 0} />
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="orders">
        <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
          {(!accountData.orders || accountData.orders.length === 0) ? (
            <Alert message="No Orders Found" type="info" showIcon />
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {accountData.orders.slice((currentPage - 1) * 5, currentPage * 5).map((order: any) => (
                <Card
                  key={order.id}
                  size="small"
                  bordered
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <Row gutter={16} align="middle">
                    <Col xs={24} md={6}>
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Order</Text>
                        <Text strong style={{ fontSize: '14px' }}>ORD-2026-{String(order.id).padStart(4, '0')}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Space>
                    </Col>

                    <Col xs={24} md={6}>
                      <Space direction="vertical" size={2}>
                        <Space>
                          <ShopOutlined style={{ color: '#722ed1' }} />
                          <Text strong>{order.retailerProfile?.shopName || 'Unknown Retailer'}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {order.saleItems?.length || 0} item(s)
                        </Text>
                      </Space>
                    </Col>

                    <Col xs={24} md={6}>
                      <Space direction="vertical" size={2}>
                        <Space>
                          <Tag color={orderStatusColors[order.status?.toLowerCase()] || 'default'} style={{ marginRight: 0, fontSize: '10px' }}>
                            {orderStatusLabels[order.status?.toLowerCase()] || order.status?.toUpperCase() || 'UNKNOWN'}
                          </Tag>
                          {order.paymentMethod && (
                            <Tag color="blue" style={{ marginRight: 0, textTransform: 'uppercase', fontSize: '10px' }}>
                              {order.paymentMethod}
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    </Col>

                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" size={2} style={{ alignItems: 'flex-end' }}>
                        <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                          {order.totalAmount?.toLocaleString()} RWF
                        </Text>
                        <Space>
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                          >
                            View
                          </Button>
                          {(order.status === 'shipped' || order.status === 'ready') && (
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleConfirmDelivery(order.id)}
                            >
                              Confirm Delivery
                            </Button>
                          )}
                        </Space>
                      </Space>
                    </Col>
                  </Row>

                  {/* Visual Progress Steps */}
                  {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'rejected' && (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <Steps
                        current={getOrderStep(order.status)}
                        size="small"
                        items={[
                          { title: 'Pending', icon: <ClockCircleOutlined /> },
                          { title: 'Proceed', icon: <CheckCircleOutlined /> },
                          { title: 'Shipped', icon: <CarOutlined /> },
                          { title: 'Delivered', icon: <CheckCircleOutlined /> },
                        ]}
                      />
                    </>
                  )}
                </Card>
              ))}
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <Pagination
                  current={currentPage}
                  pageSize={5}
                  total={accountData.orders?.length || 0}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
            </Space>
          )}
        </TabPane>
        <TabPane tab={<span><HistoryOutlined /> Transactions</span>} key="transactions">
          <Table
            dataSource={accountData.transactionHistory || []}
            rowKey="id"
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
              { title: 'Wallet', dataIndex: 'walletType', key: 'wallet' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text type={v >= 0 ? 'success' : 'danger'}>{v >= 0 ? '+' : ''}{v?.toLocaleString()} RWF</Text> },
              { title: 'Description', dataIndex: 'description', key: 'desc' },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY HH:mm') },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab={<span><CreditCardOutlined /> NFC Cards</span>} key="nfc">
          <Table
            dataSource={accountData.nfcCards || []}
            rowKey="id"
            columns={[
              { title: 'UID', dataIndex: 'uid', key: 'uid' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Type', dataIndex: 'cardType', key: 'type' },
              { title: 'Linked', dataIndex: 'createdAt', key: 'linked', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><FireOutlined /> Gas</span>} key="gas">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}><Statistic title="Total Top-ups" value={accountData.gasUsage?.totalTopups || 0} /></Col>
            <Col span={6}><Statistic title="Total Amount" value={accountData.gasUsage?.totalAmount || 0} suffix="RWF" /></Col>
            <Col span={6}><Statistic title="Total Units" value={Number(accountData.gasUsage?.totalUnits || 0).toFixed(2)} suffix="M³" /></Col>
            <Col span={6}><Statistic title="Total Rewards" value={accountData.gasUsage?.totalRewards || 0} suffix="M³" precision={4} /></Col>
          </Row>
          <Divider>Gas Meters</Divider>
          <Table
            dataSource={accountData.gasMeters || []}
            rowKey="id"
            columns={[
              { title: 'Meter #', dataIndex: 'meterNumber', key: 'meter' },
              { title: 'Alias', dataIndex: 'aliasName', key: 'alias' },
              { title: 'Owner', dataIndex: 'ownerName', key: 'owner' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><BankOutlined /> Loans</span>} key="loans">
          <Table
            dataSource={accountData.loans || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Due Date', dataIndex: 'dueDate', key: 'due', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
              { title: 'Created', dataIndex: 'createdAt', key: 'created', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><LinkOutlined /> Supply Chain</span>} key="chain">
          <List
            dataSource={accountData.supplierChain || []}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={`Retailer: ${item.retailerName}`}
                  description={item.wholesalerName ? `Wholesaler: ${item.wholesalerName}` : 'No wholesaler linked'}
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const renderRetailerAccount = () => (
    <>
      {/* Financial Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="Wallet Balance"
              value={accountData.walletBalance || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              suffix="RWF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="Profit Wallet"
              value={accountData.profitWallet || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="Credit Limit"
              value={accountData.creditSummary?.creditLimit || 0}
              prefix={<CreditCardOutlined style={{ color: '#722ed1' }} />}
              suffix="RWF"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="Outstanding Credit"
              value={accountData.outstandingLoanBalance ?? accountData.creditSummary?.usedCredit ?? 0}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              suffix="RWF"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Credit Balance"
              value={accountData.creditSummary?.availableCredit || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Linked Wholesaler */}
      {accountData.linkedWholesaler && (
        <Alert
          message="Linked Wholesaler"
          description={
            <Space>
              <BankOutlined />
              <Text strong>{accountData.linkedWholesaler.companyName}</Text>
              <Text type="secondary">Phone: {accountData.linkedWholesaler.phone}</Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Order & Sales Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Orders to Wholesaler">
            <Row gutter={[8, 8]}>
              <Col span={6}><Statistic title="Pending" value={accountData.orderStats?.pending || 0} /></Col>
              <Col span={6}><Statistic title="Active" value={accountData.orderStats?.active || 0} /></Col>
              <Col span={6}><Statistic title="Completed" value={accountData.orderStats?.completed || 0} /></Col>
              <Col span={6}><Statistic title="Total" value={accountData.orderStats?.total || 0} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Sales to Customers">
            <Row gutter={[8, 8]}>
              <Col span={6}><Statistic title="Pending" value={accountData.salesStats?.pending || 0} /></Col>
              <Col span={6}><Statistic title="Completed" value={accountData.salesStats?.completed || 0} /></Col>
              <Col span={6}><Statistic title="Revenue" value={accountData.salesStats?.totalRevenue || 0} suffix="RWF" /></Col>
              <Col span={6}><Statistic title="Total" value={accountData.salesStats?.total || 0} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Wholesale Stock Order Detail Modal */}
      <Modal
        title={`Purchase Order #${selectedStockOrder?.id}`}
        open={showStockOrderModal}
        onCancel={() => { setShowStockOrderModal(false); setSelectedStockOrder(null); }}
        footer={[
          <Button key="close" onClick={() => { setShowStockOrderModal(false); setSelectedStockOrder(null); }}>Close</Button>,
          selectedStockOrder && (
            <Button
              key="print"
              icon={<PrinterOutlined />}
              onClick={() => {
                const order = selectedStockOrder;
                const paymentLabels: Record<string, string> = { wallet: 'Capital Wallet', credit: 'Wholesale Credit', momo: 'Mobile Money' };
                const printWindow = window.open('', '_blank');
                if (!printWindow) { message.error('Please allow popups to print'); return; }
                const htmlContent = `<!DOCTYPE html><html><head><title>Purchase Order Receipt #${order.id}</title>
                  <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                    .company-name { font-size: 26px; font-weight: 800; margin: 0; }
                    .receipt-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .section-title { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
                    .info-text { font-size: 14px; margin-bottom: 4px; } .info-label { font-weight: 600; color: #4b5563; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: left; background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 12px 16px; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; }
                    td { border-bottom: 1px solid #f3f4f6; padding: 16px; font-size: 14px; }
                    .totals { margin-left: auto; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                    .grand-total { border-top: 2px solid #111827; margin-top: 12px; padding-top: 12px; font-size: 20px; font-weight: 800; }
                    .footer { text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
                  </style></head><body>
                  <div class="header">
                    <img src="/logo-big.png" alt="BIG" style="max-height:80px;" />
                    <h1 class="company-name">Big Innovation Group Ltd</h1>
                    <p class="receipt-title">Stock Purchase Receipt</p>
                  </div>
                  <div class="info-grid">
                    <div><div class="section-title">From (Wholesaler)</div><div class="info-text"><span class="info-label">${order.wholesalerProfile?.companyName || ''}</span></div></div>
                    <div style="text-align:right"><div class="section-title">Order Details</div>
                      <div class="info-text"><span class="info-label">Order Reference:</span> #${order.id}</div>
                      <div class="info-text"><span class="info-label">Date:</span> ${new Date(order.createdAt).toLocaleString()}</div>
                      <div class="info-text"><span class="info-label">Status:</span> ${order.status?.toUpperCase()}</div>
                    </div>
                  </div>
                  <table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
                  <tbody>${(order.orderItems || []).map((item: any) => `<tr><td><strong>${item.product?.name || item.productName || ''}</strong></td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${(item.price || 0).toLocaleString()} RWF</td><td style="text-align:right"><strong>${((item.price || 0) * (item.quantity || 0)).toLocaleString()} RWF</strong></td></tr>`).join('')}</tbody></table>
                  <div class="totals">
                    <div class="total-row"><span>Payment Method</span><span>${paymentLabels[order.paymentMethod] || order.paymentMethod}</span></div>
                    <div class="total-row grand-total"><span>Amount Paid</span><span>${(order.totalAmount || 0).toLocaleString()} RWF</span></div>
                  </div>
                  <div class="footer"><p>Thank you for your business. This is an official electronic receipt.</p><p>Big Innovation Group Ltd | Kigali, Rwanda</p></div>
                  <script>window.onload = () => window.print();<\/script></body></html>`;
                printWindow.document.write(htmlContent);
                printWindow.document.close();
              }}
            >
              Print Receipt
            </Button>
          ),
          (selectedStockOrder?.status === 'shipped' || selectedStockOrder?.status === 'confirmed' || selectedStockOrder?.status === 'processing') && (
            <Button
              key="confirm"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => { handleConfirmWholesaleDelivery(selectedStockOrder.id); setShowStockOrderModal(false); setSelectedStockOrder(null); }}
            >
              Confirm Delivery
            </Button>
          )
        ]}
        width={800}
      >
        {selectedStockOrder && (
          <div>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Descriptions title="Order Info" column={1} bordered size="small">
                  <Descriptions.Item label="Wholesaler">
                    {selectedStockOrder.wholesalerProfile?.companyName || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date">
                    {new Date(selectedStockOrder.createdAt).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment">
                    {(() => {
                      const pm = selectedStockOrder.paymentMethod;
                      const labelMap: Record<string, string> = { wallet: 'Capital Wallet', credit: 'Wholesale Credit', momo: 'Mobile Money' };
                      return labelMap[pm] || (pm ? pm.toUpperCase() : '—');
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {getStatusTag(selectedStockOrder.status)}
                  </Descriptions.Item>
                  {selectedStockOrder.shipperName && (
                    <Descriptions.Item label="Shipper Name">{selectedStockOrder.shipperName}</Descriptions.Item>
                  )}
                  {selectedStockOrder.shipperPhone && (
                    <Descriptions.Item label="Shipper Phone">{selectedStockOrder.shipperPhone}</Descriptions.Item>
                  )}
                  {selectedStockOrder.vehiclePlate && (
                    <Descriptions.Item label="Vehicle Plate">{selectedStockOrder.vehiclePlate}</Descriptions.Item>
                  )}
                  {selectedStockOrder.rejectionReason && (
                    <Descriptions.Item label="Rejection Reason">
                      <Text type="danger">{selectedStockOrder.rejectionReason}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'right', background: '#f0f5ff' }}>
                  <Text type="secondary">Total Amount</Text>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    {selectedStockOrder.totalAmount?.toLocaleString()} RWF
                  </Title>
                </Card>
              </Col>
            </Row>
            <Divider>Order Items</Divider>
            <Table
              dataSource={selectedStockOrder.orderItems || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product',
                  key: 'product',
                  render: (_: any, record: any) => (
                    <Space>
                      {record.product?.image ? (
                        <img src={record.product.image} alt={record.product.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                        </div>
                      )}
                      <Text strong>{record.product?.name || record.productName || '—'}</Text>
                    </Space>
                  )
                },
                { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `${v?.toLocaleString()} RWF` },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Total', key: 'total', render: (_: any, r: any) => <Text strong>{((r.price || 0) * (r.quantity || 0)).toLocaleString()} RWF</Text> },
              ]}
            />
          </div>
        )}
      </Modal>

      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
        <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
          <Table
            dataSource={accountData.orders || []}
            rowKey="id"
            columns={[
              {
                title: 'Order ID',
                dataIndex: 'id',
                key: 'id',
                render: (id: number) => <Text strong>#{id}</Text>,
              },
              {
                title: 'Date',
                dataIndex: 'createdAt',
                key: 'date',
                render: (d: string) => new Date(d).toLocaleString(),
              },
              {
                title: 'Wholesaler',
                key: 'wholesaler',
                render: (_: any, record: any) => (
                  <Space><BankOutlined /><Text>{record.wholesalerProfile?.companyName || '—'}</Text></Space>
                ),
              },
              {
                title: 'Amount',
                dataIndex: 'totalAmount',
                key: 'amount',
                render: (v: number) => <Text strong style={{ color: '#1890ff' }}>{v?.toLocaleString()} RWF</Text>,
              },
              {
                title: 'Payment Method',
                dataIndex: 'paymentMethod',
                key: 'paymentMethod',
                render: (pm: string) => {
                  const labelMap: Record<string, string> = { wallet: 'Capital Wallet', credit: 'Wholesale Credit', momo: 'Mobile Money' };
                  return <Tag icon={<BankOutlined />} color="blue">{labelMap[pm] || (pm ? pm.toUpperCase() : '—')}</Tag>;
                },
              },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: any, record: any) => (
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => { setSelectedStockOrder(record); setShowStockOrderModal(true); }}
                  >
                    View Details
                  </Button>
                ),
              },
            ]}
            pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} orders`, showSizeChanger: false }}
          />
        </TabPane>
        <TabPane tab={<span><DollarOutlined /> Sales</span>} key="sales">
          {(() => {
            const allSales = accountData.sales || [];

            // Payment colour/label maps (matches retailer OrdersPage)
            const pmColors: Record<string, string> = {
              dashboard_wallet: 'blue', credit_wallet: 'purple', mobile_money: 'gold',
              cash: 'green', wallet: 'blue', nfc: 'purple', credit: 'orange',
            };
            const pmLabels: Record<string, string> = {
              dashboard_wallet: 'Dashboard Wallet', credit_wallet: 'Credit Wallet',
              mobile_money: 'Mobile Money', cash: 'Cash', wallet: 'Wallet',
              nfc: 'NFC Card', credit: 'Credit',
            };
            const sStatusColors: Record<string, string> = {
              pending: 'orange', confirmed: 'cyan', processing: 'cyan',
              shipped: 'purple', ready: 'blue', completed: 'green',
              delivered: 'green', cancelled: 'red',
            };
            const sStatusLabels: Record<string, string> = {
              pending: 'PENDING', confirmed: 'PROCEED', processing: 'PROCEED',
              shipped: 'SHIPPED', ready: 'READY', completed: 'DELIVERED',
              delivered: 'DELIVERED', cancelled: 'CANCELLED',
            };

            // Revenue totals — use salesStats from backend (filtered by lastSettlementDate, matches retailer's own dashboard)
            const ss            = accountData.salesStats || {};
            const totalRevenue  = ss.totalRevenue           || 0;
            const walletRevenue = ss.dashboardWalletRevenue || 0;
            const creditRevenue = ss.creditWalletRevenue    || 0;
            const momoRevenue   = ss.mobileMoneyRevenue     || 0;
            const gasRewardsM3  = ss.gasRewardsM3           || 0;
            const gasRewardsRwf = ss.gasRewardsRwf          || 0;

             // Status counts — computed from the 20 most recent sales (matches how the retailer's OrdersPage computes them from the paginated result)
             const recentSalesStats = allSales.slice(0, 20);
             const pendingCount   = recentSalesStats.filter((s: any) => s.status === 'pending').length;
             const proceedCount   = recentSalesStats.filter((s: any) => s.status === 'processing' || s.status === 'confirmed').length;
             const shippedCount   = recentSalesStats.filter((s: any) => s.status === 'shipped').length;
             const readyCount     = recentSalesStats.filter((s: any) => s.status === 'ready').length;
             const completedCount = recentSalesStats.filter((s: any) => s.status === 'completed' || s.status === 'delivered').length;
             const cancelledCount = recentSalesStats.filter((s: any) => s.status === 'cancelled').length;

            // Relative time helper
            const getRelativeTime = (dateStr: string) => {
              const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
              if (diffMins < 1) return 'Just now';
              if (diffMins < 60) return `${diffMins}m ago`;
              if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
              return new Date(dateStr).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            };

            const filtered = allSales.filter((s: any) => {
              const name = s.consumerProfile?.fullName?.toLowerCase() || '';
              const matchSearch  = !salesSearch  || name.includes(salesSearch.toLowerCase()) || String(s.id).includes(salesSearch);
              const matchStatus  = !salesStatus  || s.status === salesStatus;
              const matchPayment = !salesPayment || s.paymentMethod === salesPayment;
              return matchSearch && matchStatus && matchPayment;
            });

            return (
              <>
                {/* Revenue Cards */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={5}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', border: 'none' }}>
                      <Statistic
                        title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Online Revenue</span>}
                        value={totalRevenue}
                        suffix="RWF"
                        valueStyle={{ color: 'white', fontSize: '18px' }}
                        formatter={(v) => v?.toLocaleString()}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={5}>
                    <Card size="small">
                      <Statistic title="Dashboard Wallet Revenue" value={walletRevenue} suffix="RWF"
                        valueStyle={{ color: '#1890ff', fontSize: '16px' }} formatter={(v) => v?.toLocaleString()} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={5}>
                    <Card size="small">
                      <Statistic title="Credit Wallet Revenue" value={creditRevenue} suffix="RWF"
                        valueStyle={{ color: '#722ed1', fontSize: '16px' }} formatter={(v) => v?.toLocaleString()} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={5}>
                    <Card size="small">
                      <Statistic title="Mobile Money Revenue" value={momoRevenue} suffix="RWF"
                        valueStyle={{ color: '#faad14', fontSize: '16px' }} formatter={(v) => v?.toLocaleString()} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={4}>
                    <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffc069' }}>
                      <Statistic
                        title="Gas Rewards Given"
                        value={gasRewardsM3.toFixed(4)}
                        suffix={<span>M³ <Text type="secondary" style={{ fontSize: 11 }}>({gasRewardsRwf.toLocaleString()} RWF)</Text></span>}
                        valueStyle={{ color: '#fa541c', fontSize: '16px' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Status Badge Bar */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Row align="middle" gutter={8}>
                    <Col><Text strong style={{ marginRight: 8 }}>Order Status:</Text></Col>
                    <Col>
                      <Space size="large">
                        <Badge count={pendingCount} showZero overflowCount={999}><Tag color="orange" style={{ marginRight: 0 }}>Pending</Tag></Badge>
                        <Badge count={proceedCount} showZero overflowCount={999}><Tag color="cyan" style={{ marginRight: 0 }}>Proceed</Tag></Badge>
                        <Badge count={shippedCount} showZero overflowCount={999}><Tag color="purple" style={{ marginRight: 0 }}>Shipped</Tag></Badge>
                        <Badge count={readyCount} showZero overflowCount={999}><Tag color="blue" style={{ marginRight: 0 }}>Ready</Tag></Badge>
                        <Badge count={completedCount} showZero overflowCount={999}><Tag color="green" style={{ marginRight: 0 }}>Completed</Tag></Badge>
                        <Badge count={cancelledCount} showZero overflowCount={999}><Tag color="red" style={{ marginRight: 0 }}>Cancelled</Tag></Badge>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {/* Filters */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        placeholder="Search orders..."
                        prefix={<SearchOutlined />}
                        value={salesSearch}
                        onChange={(e) => setSalesSearch(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                      <Select placeholder="All Status" value={salesStatus} onChange={setSalesStatus} style={{ width: '100%' }} allowClear>
                        <Select.Option value="">All Status</Select.Option>
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="confirmed">Confirmed</Select.Option>
                        <Select.Option value="processing">Processing</Select.Option>
                        <Select.Option value="shipped">Shipped</Select.Option>
                        <Select.Option value="ready">Ready</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                        <Select.Option value="cancelled">Cancelled</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                      <Select placeholder="All Payments" value={salesPayment} onChange={setSalesPayment} style={{ width: '100%' }} allowClear>
                        <Select.Option value="">All Payments</Select.Option>
                        <Select.Option value="dashboard_wallet">Dashboard Wallet</Select.Option>
                        <Select.Option value="credit_wallet">Credit Wallet</Select.Option>
                        <Select.Option value="wallet">Wallet</Select.Option>
                        <Select.Option value="mobile_money">Mobile Money</Select.Option>
                        <Select.Option value="nfc">NFC Card</Select.Option>
                        <Select.Option value="credit">Credit</Select.Option>
                      </Select>
                    </Col>
                  </Row>
                </Card>

                {/* Sales Table */}
                <Card>
                  <Table
                    dataSource={filtered}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 20, showTotal: (total) => `Total ${total} orders`, showSizeChanger: true }}
                    rowClassName={(record: any) => record.status === 'pending' ? 'ant-table-row-pending' : ''}
                    columns={[
                      {
                        title: 'Order #',
                        dataIndex: 'id',
                        key: 'id',
                        render: (id: number) => <Text strong>#{id}</Text>,
                      },
                      {
                        title: 'Customer',
                        key: 'customer',
                        render: (_: any, record: any) => (
                          <div>
                            <Text strong>{record.consumerProfile?.fullName || '—'}</Text>
                            {record.consumerProfile?.phone && (
                              <><br /><Text type="secondary" style={{ fontSize: 12 }}>{record.consumerProfile.phone}</Text></>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Items',
                        key: 'items',
                        render: (_: any, record: any) => (
                          <Badge count={record.saleItems?.length || 0} showZero>
                            <ShoppingCartOutlined style={{ fontSize: 18 }} />
                          </Badge>
                        ),
                      },
                      {
                        title: 'Total',
                        dataIndex: 'totalAmount',
                        key: 'total',
                        render: (v: number) => <Text strong style={{ color: '#0ea5e9' }}>{v?.toLocaleString()} RWF</Text>,
                        sorter: (a: any, b: any) => a.totalAmount - b.totalAmount,
                      },
                      {
                        title: 'Payment',
                        dataIndex: 'paymentMethod',
                        key: 'payment',
                        render: (pm: string) => (
                          <Tag color={pmColors[pm] || 'default'}>{pmLabels[pm] || pm?.toUpperCase() || '—'}</Tag>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (s: string) => (
                          <Tag color={sStatusColors[s] || 'default'}>{sStatusLabels[s] || s?.toUpperCase()}</Tag>
                        ),
                      },
                      {
                        title: 'Time',
                        dataIndex: 'createdAt',
                        key: 'time',
                        render: (d: string) => <Text>{getRelativeTime(d)}</Text>,
                        sorter: (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                        defaultSortOrder: 'ascend' as const,
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button type="text" icon={<EyeOutlined />} size="small"
                              onClick={() => { setSelectedOrder(record); setShowOrderModal(true); }} />
                            {record.status === 'pending' && (
                              <>
                                <Button type="primary" size="small" icon={<CheckOutlined />}
                                  onClick={() => setSalesActionModal({ visible: true, order: record, action: 'accept' })}>Accept</Button>
                                <Button danger size="small" icon={<CloseOutlined />}
                                  onClick={() => setSalesActionModal({ visible: true, order: record, action: 'reject' })}>Reject</Button>
                              </>
                            )}
                            {(record.status === 'processing' || record.status === 'confirmed') && (
                              <Space>
                                <Button type="primary" size="small" icon={<TruckOutlined />}
                                  onClick={() => setSalesActionModal({ visible: true, order: record, action: 'ship' })}>Ship</Button>
                                <Button size="small"
                                  onClick={() => setSalesActionModal({ visible: true, order: record, action: 'ready' })}>Ready</Button>
                              </Space>
                            )}
                            {(record.status === 'shipped' || record.status === 'ready') && (
                              <Button type="primary" size="small" icon={<CheckCircleOutlined />}
                                onClick={() => handleConfirmDelivery(record.id)}>Confirm Delivery</Button>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>

                {/* Sales Action Modal (retailer order override actions) */}
                <Modal
                  title={(() => {
                    switch (salesActionModal.action) {
                      case 'accept': return 'Accept Order';
                      case 'reject': return 'Reject Order';
                      case 'ready': return 'Mark as Ready';
                      case 'ship': return 'Ship Order';
                      case 'complete': return 'Complete Order';
                      case 'cancel': return 'Cancel Order';
                      default: return 'Order Action';
                    }
                  })()}
                  open={salesActionModal.visible}
                  onCancel={() => {
                    setSalesActionNotes('');
                    setSalesShipperName('');
                    setSalesShipperPhone('');
                    setSalesVehiclePlate('');
                    setSalesActionModal({ visible: false, order: null, action: null });
                  }}
                  onOk={handleSalesAction}
                  confirmLoading={salesActionLoading}
                  okText={salesActionModal.action === 'reject' || salesActionModal.action === 'cancel' ? 'Confirm Cancel' : 'Confirm'}
                  okButtonProps={{
                    danger: salesActionModal.action === 'reject' || salesActionModal.action === 'cancel',
                  }}
                >
                  {salesActionModal.order && (
                    <div>
                      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Order">
                          #{salesActionModal.order.id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Customer">
                          {salesActionModal.order.consumerProfile?.fullName || 'Walk-in Customer'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total">
                          <Text strong>{salesActionModal.order.totalAmount?.toLocaleString()} RWF</Text>
                        </Descriptions.Item>
                      </Descriptions>

                      {(salesActionModal.action === 'reject' || salesActionModal.action === 'cancel') && (
                        <Form.Item label="Reason" required style={{ marginBottom: 0 }}>
                          <Input.TextArea
                            value={salesActionNotes}
                            onChange={(e) => setSalesActionNotes(e.target.value)}
                            placeholder="Enter reason for cancellation..."
                            rows={3}
                          />
                        </Form.Item>
                      )}

                      {(salesActionModal.action === 'accept' || salesActionModal.action === 'ready' || salesActionModal.action === 'ship') && (
                        <Form.Item label="Notes (optional)" style={{ marginBottom: 16 }}>
                          <Input.TextArea
                            value={salesActionNotes}
                            onChange={(e) => setSalesActionNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={2}
                          />
                        </Form.Item>
                      )}

                      {salesActionModal.action === 'ship' && (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Form.Item label="Shipper Name" required>
                            <Input
                              value={salesShipperName}
                              onChange={(e) => setSalesShipperName(e.target.value)}
                              placeholder="Enter driver/shipper name"
                            />
                          </Form.Item>
                          <Form.Item label="Shipper Phone" required>
                            <Input
                              value={salesShipperPhone}
                              onChange={(e) => setSalesShipperPhone(e.target.value)}
                              placeholder="Enter phone number"
                            />
                          </Form.Item>
                          <Form.Item label="Vehicle Plate Number" required>
                            <Input
                              value={salesVehiclePlate}
                              onChange={(e) => setSalesVehiclePlate(e.target.value)}
                              placeholder="Enter plate number (e.g. RAD 123 A)"
                            />
                          </Form.Item>
                        </Space>
                      )}
                    </div>
                  )}
                </Modal>
              </>
            );
          })()}
        </TabPane>
        <TabPane tab={<span><CreditCardOutlined /> NFC Cards</span>} key="nfc">
          <Table
            dataSource={accountData.nfcCards || []}
            rowKey="id"
            columns={[
              { title: 'UID', dataIndex: 'uid', key: 'uid' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v: number) => `${v?.toLocaleString()} RWF` },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><BankOutlined /> Credit Requests</span>} key="credit">
          <Table
            dataSource={accountData.creditRequests || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Amount', dataIndex: 'requestedAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><ShopOutlined /> Inventory Data</span>} key="inventory">
          {(() => {
            const invProducts = accountData.products || [];
            
            // Normalize products matching retailer page
            const normalizedInvProducts = invProducts.map((p: any) => {
              const pCostPrice = p.cost_price || p.cost || p.costPrice || 0;
              const pSellingPrice = p.retailerPrice || p.selling_price || p.price || 0;
              return {
                ...p,
                cost_price: pCostPrice,
                selling_price: pSellingPrice,
                low_stock_threshold: p.lowStockThreshold || p.threshold || 10,
              };
            }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

            const totalProductsCount = normalizedInvProducts.length;
            const totalInventoryValue = normalizedInvProducts.reduce(
              (sum: number, p: any) => sum + p.stock * p.cost_price,
              0
            );
            const lowStockCount = normalizedInvProducts.filter(
              (p: any) => p.stock > 0 && p.stock <= p.low_stock_threshold
            ).length;
            const outOfStockCount = normalizedInvProducts.filter((p: any) => p.stock === 0).length;
            const uniqueCategoriesCount = new Set(normalizedInvProducts.map((p: any) => p.category)).size;

            return (
              <>
                {/* Stats Cards */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} md={5}>
                    <Card size="small">
                      <Statistic
                        title="Total Products"
                        value={totalProductsCount}
                        prefix={<AppstoreOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={5}>
                    <Card size="small">
                      <Statistic
                        title="Inventory Value"
                        value={totalInventoryValue}
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
                        value={lowStockCount}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<WarningOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={5}>
                    <Card size="small">
                      <Statistic
                        title="Out of Stock"
                        value={outOfStockCount}
                        valueStyle={{ color: '#ff4d4f' }}
                        prefix={<WarningOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Card size="small">
                      <Statistic
                        title="Categories"
                        value={uniqueCategoriesCount}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Print Barcodes Button bar */}
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button
                    icon={<BarcodeOutlined />}
                    onClick={() => {
                      setSelectedBarcodeProductIds(normalizedInvProducts.map((p: any) => p.id));
                      const initialQuantities: Record<string, number> = {};
                      normalizedInvProducts.forEach((p: any) => {
                        initialQuantities[p.id] = 1;
                      });
                      setBarcodeQuantities(initialQuantities);
                      setBarcodeModalVisible(true);
                    }}
                  >
                    Print Barcodes
                  </Button>
                </Row>

                <Table
                  dataSource={normalizedInvProducts}
                  rowKey="id"
                  columns={[
                    {
                      title: 'Product',
                      key: 'product',
                      render: (_: any, record: any) => (
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
                      render: (c: string) => <Tag>{c}</Tag> 
                    },
                    {
                      title: 'Stock',
                      key: 'stock',
                      render: (_: any, record: any) => {
                        const status = getStockStatus(record.stock, record.low_stock_threshold);
                        const percentage = Math.min((record.stock / (record.low_stock_threshold * 2)) * 100, 100);
                        
                        const conversionFactor = record.conversionFactor;
                        const purchaseUnit = record.purchaseUnit;
                        const baseUnit = record.baseUnit;
                        
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
                    },
                    {
                      title: 'Status',
                      key: 'status',
                      render: (_: any, record: any) => {
                        const status = getStockStatus(record.stock, record.low_stock_threshold);
                        return (
                          <Badge
                            status={status.status === 'exception' ? 'error' : status.status === 'normal' ? 'warning' : 'success'}
                            text={<Tag color={status.color}>{status.text}</Tag>}
                          />
                        );
                      },
                    },
                    {
                      title: 'Cost Price',
                      dataIndex: 'cost_price',
                      key: 'cost_price',
                      render: (value: number) => `${value?.toLocaleString()} RWF`,
                    },
                    {
                      title: 'Selling Price',
                      dataIndex: 'selling_price',
                      key: 'selling_price',
                      render: (value: number) => (
                        <Text strong style={{ color: '#0ea5e9' }}>{value?.toLocaleString()} RWF</Text>
                      ),
                    },
                    {
                      title: 'Margin',
                      key: 'margin',
                      render: (_: any, record: any) => {
                        const margin = record.profitMargin !== undefined ? record.profitMargin : 
                          (record.cost_price > 0 ? ((record.selling_price - record.cost_price) / record.cost_price) * 100 : 0);
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
                      render: (_: any, record: any) => (
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
                  ]}
                  pagination={{ pageSize: 10 }}
                />
              </>
            );
          })()}
        </TabPane>
      </Tabs>
    </>
  );

  const renderWorkerAccount = () => (
    <>
      {/* Worker Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Salary"
              value={accountData.salary || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Present Days (Month)"
              value={accountData.attendanceSummary?.presentDays || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={accountData.taskStats?.completed || 0}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Work Hours"
              value={accountData.attendanceSummary?.totalWorkHours || 0}
              suffix="hrs"
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="attendance">
        <TabPane tab="Attendance" key="attendance">
          <Table
            dataSource={accountData.recentAttendance || []}
            rowKey="id"
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Check In', dataIndex: 'checkIn', key: 'in', render: (t: string) => t || '-' },
              { title: 'Check Out', dataIndex: 'checkOut', key: 'out', render: (t: string) => t || '-' },
              { title: 'Hours', dataIndex: 'workHours', key: 'hours' },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab="Tasks" key="tasks">
          <Table
            dataSource={accountData.tasks || []}
            rowKey="id"
            columns={[
              { title: 'Title', dataIndex: 'title', key: 'title' },
              { title: 'Project', dataIndex: ['project', 'name'], key: 'project' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Priority', dataIndex: 'priority', key: 'priority' },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab="Training" key="training">
          <List
            dataSource={accountData.trainingProgress || []}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={item.courseTitle}
                  description={<Progress percent={item.progress} size="small" />}
                />
                <Tag color={item.status === 'completed' ? 'green' : 'blue'}>{item.status}</Tag>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const renderWholesalerAccount = () => {
    // ── Helpers shared across wholesaler tabs ──
    const wsWholesalerId = accountData.profile?.id;

    const wsStatusColors: Record<string, string> = {
      pending: 'orange', confirmed: 'blue', processing: 'cyan',
      shipped: 'purple', delivered: 'green', cancelled: 'default', rejected: 'red',
    };
    const wsStatusLabels: Record<string, string> = {
      pending: 'PENDING', confirmed: 'PROCEED', processing: 'PROCEED',
      shipped: 'SHIPPED', delivered: 'DELIVERED', cancelled: 'CANCELLED', rejected: 'REJECTED',
    };
    const wsPaymentColors: Record<string, string> = {
      credit: 'orange', bank_transfer: 'blue', cash: 'green', mobile_money: 'purple',
    };

    const wsFormatDate = (d: string) => new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const wsGetStatusStep = (status: string) => {
      switch (status) {
        case 'pending': return 0;
        case 'confirmed': case 'processing': return 1;
        case 'shipped': return 2;
        case 'delivered': return 3;
        default: return -1;
      }
    };

    // ── Order action handlers ──
    const handleWsConfirmOrder = async () => {
      if (!wsSelectedOrder) return;
      setWsActionLoading(true);
      try {
        await adminApi.adminConfirmWholesalerOrder(wsWholesalerId, wsSelectedOrder.id);
        message.success('Order confirmed successfully');
        setWsConfirmModalOpen(false);
        setWsSelectedOrder(null);
        fetchAccountDetails();
      } catch (err: any) {
        message.error(err.response?.data?.error || 'Failed to confirm order');
      } finally {
        setWsActionLoading(false);
      }
    };

    const handleWsRejectOrder = async () => {
      if (!wsSelectedOrder) return;
      try {
        const values = await wsForm.validateFields();
        setWsActionLoading(true);
        await adminApi.adminRejectWholesalerOrder(wsWholesalerId, wsSelectedOrder.id, values.reason);
        message.success('Order rejected');
        setWsRejectModalOpen(false);
        setWsSelectedOrder(null);
        wsForm.resetFields();
        fetchAccountDetails();
      } catch (err: any) {
        if (err.errorFields) return;
        message.error(err.response?.data?.error || 'Failed to reject order');
      } finally {
        setWsActionLoading(false);
      }
    };

    const handleWsShipOrder = async () => {
      if (!wsSelectedOrder) return;
      try {
        const values = await wsForm.validateFields();
        setWsActionLoading(true);
        await adminApi.adminShipWholesalerOrder(
          wsWholesalerId, wsSelectedOrder.id,
          values.shipper_name, values.shipper_phone, values.vehicle_plate,
          values.tracking_number, values.delivery_notes
        );
        message.success('Order marked as shipped');
        setWsShipModalOpen(false);
        setWsSelectedOrder(null);
        wsForm.resetFields();
        fetchAccountDetails();
      } catch (err: any) {
        if (err.errorFields) return;
        message.error(err.response?.data?.error || 'Failed to ship order');
      } finally {
        setWsActionLoading(false);
      }
    };

    // ── Inventory action handlers ──
    const handleWsUpdateProduct = async () => {
      if (!wsSelectedProduct) return;
      try {
        const values = await wsInvForm.validateFields();
        setWsInvActionLoading(true);
        if (wsFileList.length > 0 && wsFileList[0].originFileObj) {
          const reader = new FileReader();
          reader.readAsDataURL(wsFileList[0].originFileObj);
          await new Promise<void>((resolve) => {
            reader.onload = () => { values.image = reader.result as string; resolve(); };
          });
        }
        await adminApi.adminUpdateWholesalerProduct(wsWholesalerId, wsSelectedProduct.id, values);
        message.success('Product updated');
        setWsEditModalOpen(false);
        setWsSelectedProduct(null);
        wsInvForm.resetFields();
        setWsFileList([]);
        fetchAccountDetails(true);
      } catch (err: any) {
        if (err.errorFields) return;
        message.error(err.response?.data?.error || 'Failed to update product');
      } finally {
        setWsInvActionLoading(false);
      }
    };

    const handleWsUpdateStock = async () => {
      if (!wsSelectedProduct) return;
      try {
        const values = await wsInvForm.validateFields();
        setWsInvActionLoading(true);
        await adminApi.adminUpdateWholesalerStock(wsWholesalerId, wsSelectedProduct.id, values.quantity, values.type, values.reason);
        message.success('Stock updated');
        setWsStockModalOpen(false);
        setWsSelectedProduct(null);
        wsInvForm.resetFields();
        fetchAccountDetails(true);
      } catch (err: any) {
        if (err.errorFields) return;
        message.error(err.response?.data?.error || 'Failed to update stock');
      } finally {
        setWsInvActionLoading(false);
      }
    };

    const handleWsDeleteProduct = async (productId: string) => {
      try {
        setWsInvActionLoading(true);
        await adminApi.adminDeleteWholesalerProduct(wsWholesalerId, productId);
        message.success('Product deleted');
        fetchAccountDetails(true);
      } catch (err: any) {
        message.error(err.response?.data?.error || 'Failed to delete product');
      } finally {
        setWsInvActionLoading(false);
      }
    };

    // ── Derived order data ──
    const allOrders: any[] = accountData.orders || [];
    const filteredOrders = allOrders.filter((o: any) => {
      const matchStatus = !wsOrderStatusFilter || o.status === wsOrderStatusFilter;
      const matchPayment = !wsOrderPaymentFilter || o.paymentType === wsOrderPaymentFilter;
      return matchStatus && matchPayment;
    });

    const wsStats = {
      today_orders: allOrders.filter((o: any) => new Date(o.createdAt) >= new Date(new Date().setHours(0,0,0,0))).length,
      today_revenue: allOrders
        .filter((o: any) => new Date(o.createdAt) >= new Date(new Date().setHours(0,0,0,0)) && o.status !== 'cancelled')
        .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0),
      pending_orders: allOrders.filter((o: any) => o.status === 'pending').length,
      shipped_orders: allOrders.filter((o: any) => o.status === 'shipped').length,
    };

    // ── Derived inventory data ──
    const rawProducts: any[] = accountData.products || [];
    const normalizedProducts = rawProducts.map((p: any) => ({
      ...p,
      cost_price: p.supplierCost || p.costPrice || p.cost_price || 0,
      wholesale_price: p.price || p.wholesale_price || 0,
      low_stock_threshold: p.lowStockThreshold || p.low_stock_threshold || 10,
      invoice_number: p.invoiceNumber || p.invoice_number || '',
      taxType: p.taxType || 'B',
    }));

    const wsInvFiltered = normalizedProducts.filter((p: any) => {
      const matchSearch = !wsInvSearchQuery || p.name.toLowerCase().includes(wsInvSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(wsInvSearchQuery.toLowerCase());
      const matchCat = !wsInvCategoryFilter || p.category === wsInvCategoryFilter;
      const matchLow = !wsInvLowStockFilter || (p.stock > 0 && p.stock <= p.low_stock_threshold);
      return matchSearch && matchCat && matchLow;
    });

    const wsInvStats = {
      total_products: normalizedProducts.length,
      stock_value_supplier_cost: normalizedProducts.reduce((s: number, p: any) => s + p.stock * p.cost_price, 0),
      stock_value_wholesaler_price: normalizedProducts.reduce((s: number, p: any) => s + p.stock * p.wholesale_price, 0),
      stock_profit_margin: normalizedProducts.reduce((s: number, p: any) => s + p.stock * (p.wholesale_price - p.cost_price), 0),
      low_stock_count: normalizedProducts.filter((p: any) => p.stock > 0 && p.stock <= p.low_stock_threshold).length,
      out_of_stock_count: normalizedProducts.filter((p: any) => p.stock === 0).length,
    };

    const wsInvCategories = [...new Set(normalizedProducts.map((p: any) => p.category).filter(Boolean))];

    const wsGetStockStatus = (stock: number, threshold: number) => {
      if (stock === 0) return { color: 'red', text: 'Out of Stock', status: 'exception' as const };
      if (stock <= threshold) return { color: 'orange', text: 'Low Stock', status: 'normal' as const };
      return { color: 'green', text: 'In Stock', status: 'success' as const };
    };

    // ── Order columns ──
    const wsOrderColumns = [
      {
        title: 'Order #', key: 'orderNumber',
        render: (_: any, r: any) => <Text code strong>{r.orderNumber || `ORD-${r.id}`}</Text>,
      },
      {
        title: 'Retailer', key: 'retailer',
        render: (_: any, r: any) => {
          const ret = r.retailer || r.retailerProfile || {};
          return (
            <div>
              <div><strong>{ret.shopName || ret.user?.name || 'N/A'}</strong></div>
              <Text type="secondary" style={{ fontSize: '12px' }}>{ret.location || ret.address || 'General'}</Text>
            </div>
          );
        },
      },
      { title: 'Items', key: 'items_count', render: (_: any, r: any) => r.orderItems?.length || r.items?.length || 0 },
      {
        title: 'Total', dataIndex: 'totalAmount', key: 'total',
        render: (v: number) => <Text strong style={{ color: '#7c3aed' }}>{v?.toLocaleString()} RWF</Text>,
      },
      {
        title: 'Payment', dataIndex: 'paymentType', key: 'payment',
        render: (v: string) => <Tag color={wsPaymentColors[v] || 'default'}>{v?.replace('_', ' ').toUpperCase()}</Tag>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status',
        render: (v: string) => <Tag color={wsStatusColors[v] || 'default'}>{wsStatusLabels[v] || v?.toUpperCase()}</Tag>,
      },
      {
        title: 'Date', dataIndex: 'createdAt', key: 'date',
        render: (v: string) => wsFormatDate(v),
      },
      {
        title: 'Actions', key: 'actions',
        render: (_: any, r: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => { setWsSelectedOrder(r); setWsDetailModalOpen(true); }}>View</Button>
            {r.status === 'pending' && (
              <>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />}
                  onClick={() => { setWsSelectedOrder(r); setWsConfirmModalOpen(true); }}>Accept</Button>
                <Button danger size="small" icon={<CloseCircleOutlined />}
                  onClick={() => { setWsSelectedOrder(r); wsForm.resetFields(); setWsRejectModalOpen(true); }}>Reject</Button>
              </>
            )}
            {(r.status === 'confirmed' || r.status === 'processing') && (
              <Button type="primary" size="small" icon={<CarOutlined />}
                onClick={() => { setWsSelectedOrder(r); wsForm.resetFields(); setWsShipModalOpen(true); }}>Ship</Button>
            )}
            {r.status === 'shipped' && <Tag color="purple">WAITING DELIVERY</Tag>}
          </Space>
        ),
      },
    ];

    // ── Inventory columns ──
    const wsInvColumns = [
      { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (v: string) => <code>{v}</code> },
      {
        title: 'Invoice #', dataIndex: 'invoice_number', key: 'invoice',
        render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <Text type="secondary">-</Text>,
      },
      {
        title: 'Product', dataIndex: 'name', key: 'name',
        render: (v: string, r: any) => (
          <Space>
            <Avatar src={r.image} shape="square" size={40} icon={<InboxOutlined />} />
            <strong>{v}</strong>
          </Space>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (v: string) => <Tag>{v}</Tag> },
      {
        title: 'Stock Level', key: 'stock_level',
        render: (_: any, r: any) => {
          const st = wsGetStockStatus(r.stock, r.low_stock_threshold);
          return (
            <div style={{ width: 150 }}>
              <Progress
                percent={Math.min((r.stock / Math.max(r.low_stock_threshold, 1)) * 100, 100)}
                size="small" status={st.status}
                format={() => `${r.stock} ${r.unit || 'units'}`}
              />
            </div>
          );
        },
      },
      {
        title: 'Status', key: 'inv_status',
        render: (_: any, r: any) => { const st = wsGetStockStatus(r.stock, r.low_stock_threshold); return <Tag color={st.color}>{st.text}</Tag>; },
      },
      {
        title: 'Supplier Cost', dataIndex: 'cost_price', key: 'cost',
        render: (v: number) => <Text style={{ color: '#fa8c16' }}>{v?.toLocaleString()} RWF</Text>,
      },
      {
        title: 'Wholesaler Price', dataIndex: 'wholesale_price', key: 'ws_price',
        render: (v: number) => <Text strong style={{ color: '#7c3aed' }}>{v?.toLocaleString()} RWF</Text>,
      },
      {
        title: 'Margin', key: 'margin',
        render: (_: any, r: any) => {
          let preTax = r.wholesale_price;
          if (r.taxType === 'B') preTax = r.wholesale_price / 1.18;
          else if (r.taxType === 'D') preTax = r.wholesale_price / 1.298;
          const m = r.cost_price > 0 && preTax > 0 ? ((preTax - r.cost_price) / r.cost_price) * 100 : 0;
          return <span style={{ color: m > 0 ? '#22c55e' : '#ef4444' }}>{m.toFixed(1)}%</span>;
        },
      },
      {
        title: 'Actions', key: 'inv_actions',
        render: (_: any, r: any) => (
          <Space>
            <Button size="small" onClick={() => { setWsSelectedProduct(r); wsInvForm.setFieldsValue({ ...r, low_stock_threshold: r.low_stock_threshold, invoice_number: r.invoice_number }); if (r.image) { setWsFileList([{ uid: '-1', name: 'image.png', status: 'done', url: r.image }]); } else { setWsFileList([]); } setWsEditModalOpen(true); }}>Edit</Button>
            <Button size="small" type="primary" ghost onClick={() => { setWsSelectedProduct(r); wsInvForm.resetFields(); setWsStockModalOpen(true); }}>Stock</Button>
            <Popconfirm title="Delete this product?" onConfirm={() => handleWsDeleteProduct(r.id)} okText="Yes" cancelText="No" okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <>
        {/* Top Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={5}>
            <Card><Statistic title="Linked Retailers" value={accountData.linkedRetailers?.length || 0} prefix={<ShopOutlined style={{ color: '#1890ff' }} />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card><Statistic title="Total Revenue" value={accountData.orderStats?.totalRevenue || 0} prefix={<DollarOutlined style={{ color: '#52c41a' }} />} suffix="RWF" valueStyle={{ color: '#52c41a', fontSize: '18px' }} formatter={(v) => v?.toLocaleString()} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card><Statistic title="Profit Wallet" value={accountData.profitWallet || 0} prefix={<DollarOutlined style={{ color: '#722ed1' }} />} suffix="RWF" valueStyle={{ color: '#722ed1', fontSize: '18px' }} formatter={(v) => v?.toLocaleString()} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Card><Statistic title="Pending Orders" value={accountData.orderStats?.pending || 0} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="Total Products" value={accountData.inventory?.totalProducts || 0} prefix={<ShoppingCartOutlined />} /></Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="retailers">
          {/* ── Linked Retailers tab ── */}
          <TabPane tab={<span><ShopOutlined /> Linked Retailers</span>} key="retailers">
            <Table
              dataSource={accountData.linkedRetailers || []}
              rowKey="id"
              columns={[
                { title: 'Shop Name', dataIndex: 'shopName', key: 'name' },
                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                { title: 'Credit Limit', dataIndex: 'creditLimit', key: 'credit', render: (v: number) => `${v?.toLocaleString()} RWF` },
                { title: 'Used Credit', dataIndex: 'usedCredit', key: 'used', render: (v: number) => `${v?.toLocaleString()} RWF` },
                { title: 'Status', dataIndex: 'isActive', key: 'status', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
              ]}
              pagination={false}
            />
          </TabPane>

          {/* ── Orders tab — full wholesaler parity ── */}
          <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
            {/* Stats row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}><Card size="small"><Statistic title="Today's Orders" value={wsStats.today_orders} prefix={<ShoppingCartOutlined />} /></Card></Col>
              <Col xs={12} sm={6}><Card size="small"><Statistic title="Today's Revenue" value={wsStats.today_revenue} suffix="RWF" prefix={<DollarOutlined />} formatter={(v) => v?.toLocaleString()} /></Card></Col>
              <Col xs={12} sm={6}><Card size="small"><Statistic title="Pending" value={wsStats.pending_orders} valueStyle={{ color: '#f97316' }} prefix={<ClockCircleOutlined />} /></Card></Col>
              <Col xs={12} sm={6}><Card size="small"><Statistic title="In Transit" value={wsStats.shipped_orders} valueStyle={{ color: '#7c3aed' }} prefix={<CarOutlined />} /></Card></Col>
            </Row>
            {/* Filters */}
            <Card style={{ marginBottom: 12 }}>
              <Space wrap>
                <Select placeholder="Filter by Status" allowClear style={{ width: 150 }} value={wsOrderStatusFilter || undefined}
                  onChange={(v) => setWsOrderStatusFilter(v || '')}>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="confirmed">Confirmed</Select.Option>
                  <Select.Option value="processing">Processing</Select.Option>
                  <Select.Option value="shipped">Shipped</Select.Option>
                  <Select.Option value="delivered">Delivered</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                </Select>
                <Select placeholder="Filter by Payment" allowClear style={{ width: 150 }} value={wsOrderPaymentFilter || undefined}
                  onChange={(v) => setWsOrderPaymentFilter(v || '')}>
                  <Select.Option value="credit">Credit</Select.Option>
                  <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                  <Select.Option value="cash">Cash</Select.Option>
                  <Select.Option value="mobile_money">Mobile Money</Select.Option>
                </Select>
              </Space>
            </Card>
            {/* Table */}
            <Card>
              <Table dataSource={filteredOrders} columns={wsOrderColumns} rowKey="id" scroll={{ x: 1000 }} size="small"
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} orders`, size: 'small' }} />
            </Card>

            {/* ── Accept Modal ── */}
            <Modal title={`Accept Order ${wsSelectedOrder?.orderNumber || `ORD-${wsSelectedOrder?.id}`}`}
              open={wsConfirmModalOpen} onCancel={() => { setWsConfirmModalOpen(false); setWsSelectedOrder(null); }}
              onOk={handleWsConfirmOrder} confirmLoading={wsActionLoading} okText="Accept Order">
              <p>Are you sure you want to accept this order?</p>
              {wsSelectedOrder && (() => {
                const ret = wsSelectedOrder.retailer || wsSelectedOrder.retailerProfile || {};
                return (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Retailer">{ret.shopName || ret.user?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Items">{wsSelectedOrder.orderItems?.length || wsSelectedOrder.items?.length || 0}</Descriptions.Item>
                    <Descriptions.Item label="Total">{wsSelectedOrder.totalAmount?.toLocaleString()} RWF</Descriptions.Item>
                    <Descriptions.Item label="Payment"><Tag color={wsPaymentColors[wsSelectedOrder.paymentType] || 'default'}>{wsSelectedOrder.paymentType?.replace('_', ' ').toUpperCase()}</Tag></Descriptions.Item>
                  </Descriptions>
                );
              })()}
            </Modal>

            {/* ── Reject Modal ── */}
            <Modal title={`Reject Order ${wsSelectedOrder?.orderNumber || `ORD-${wsSelectedOrder?.id}`}`}
              open={wsRejectModalOpen} onCancel={() => { setWsRejectModalOpen(false); setWsSelectedOrder(null); wsForm.resetFields(); }}
              onOk={handleWsRejectOrder} confirmLoading={wsActionLoading} okText="Reject Order" okButtonProps={{ danger: true }}>
              <Form form={wsForm} layout="vertical">
                <Form.Item name="reason" label="Rejection Reason" rules={[{ required: true, message: 'Please provide a reason' }]}>
                  <Input.TextArea rows={4} placeholder="Enter the reason for rejecting this order..." />
                </Form.Item>
              </Form>
            </Modal>

            {/* ── Ship Modal ── */}
            <Modal title={`Ship Order ${wsSelectedOrder?.orderNumber || `ORD-${wsSelectedOrder?.id}`}`}
              open={wsShipModalOpen} onCancel={() => { setWsShipModalOpen(false); setWsSelectedOrder(null); wsForm.resetFields(); }}
              onOk={handleWsShipOrder} confirmLoading={wsActionLoading} okText="Mark as Shipped">
              <Form form={wsForm} layout="vertical">
                <Form.Item name="shipper_name" label="Shipper Name" rules={[{ required: true, message: 'Please enter shipper name' }]}>
                  <Input placeholder="Enter driver/shipper name..." />
                </Form.Item>
                <Form.Item name="shipper_phone" label="Shipper Phone" rules={[{ required: true, message: 'Please enter shipper phone number' }]}>
                  <Input placeholder="Enter shipper phone number..." />
                </Form.Item>
                <Form.Item name="vehicle_plate" label="Vehicle Plate Number" rules={[{ required: true, message: 'Please enter vehicle plate number' }]}>
                  <Input placeholder="Enter vehicle plate (e.g., RAA 123A)..." />
                </Form.Item>
                <Form.Item name="tracking_number" label="Tracking Number">
                  <Input placeholder="Optional tracking number..." />
                </Form.Item>
                <Form.Item name="delivery_notes" label="Delivery Notes">
                  <Input.TextArea rows={3} placeholder="Any delivery instructions or notes..." />
                </Form.Item>
              </Form>
            </Modal>

            {/* ── Order Detail Modal ── */}
            <Modal title={`Order #${wsSelectedOrder?.orderNumber || wsSelectedOrder?.id}`}
              open={wsDetailModalOpen} onCancel={() => { setWsDetailModalOpen(false); setWsSelectedOrder(null); }} width={800}
              footer={[
                <Button key="close" onClick={() => setWsDetailModalOpen(false)}>Close</Button>,
                wsSelectedOrder?.status === 'pending' && (
                  <Button key="confirm" type="primary" onClick={() => { setWsDetailModalOpen(false); setWsConfirmModalOpen(true); }}>Accept Order</Button>
                ),
                (wsSelectedOrder?.status === 'confirmed' || wsSelectedOrder?.status === 'processing') && (
                  <Button key="ship" type="primary" onClick={() => { setWsDetailModalOpen(false); wsForm.resetFields(); setWsShipModalOpen(true); }}>Ship Order</Button>
                ),
              ].filter(Boolean)}>
              {wsSelectedOrder && (() => {
                const ret = wsSelectedOrder.retailer || wsSelectedOrder.retailerProfile || {};
                const items = wsSelectedOrder.orderItems || wsSelectedOrder.items || [];
                return (
                  <>
                    {wsSelectedOrder.status !== 'rejected' && wsSelectedOrder.status !== 'cancelled' && (
                      <Steps current={wsGetStatusStep(wsSelectedOrder.status)} style={{ marginBottom: 24 }}
                        items={[
                          { title: 'Pending', icon: <ClockCircleOutlined /> },
                          { title: 'Proceed', icon: <ShoppingCartOutlined /> },
                          { title: 'Shipped', icon: <CarOutlined /> },
                          { title: 'Delivered', icon: <CheckCircleOutlined /> },
                        ]} />
                    )}
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Card size="small" title="Order Details">
                          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="Order Number"><Text code>{wsSelectedOrder.orderNumber || `ORD-${wsSelectedOrder.id}`}</Text></Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag color={wsStatusColors[wsSelectedOrder.status]}>{wsStatusLabels[wsSelectedOrder.status] || wsSelectedOrder.status?.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Retailer">{ret.shopName || ret.user?.name || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{ret.user?.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Payment"><Tag color={wsPaymentColors[wsSelectedOrder.paymentType] || 'default'}>{wsSelectedOrder.paymentType?.replace('_', ' ').toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Order Date">{wsFormatDate(wsSelectedOrder.createdAt)}</Descriptions.Item>
                            {wsSelectedOrder.rejection_reason && <Descriptions.Item label="Rejection Reason"><Text type="danger">{wsSelectedOrder.rejection_reason || wsSelectedOrder.rejectionReason}</Text></Descriptions.Item>}
                          </Descriptions>
                        </Card>
                      </Col>
                      {items.length > 0 && (
                        <Col span={24}>
                          <Card size="small" title="Order Items">
                            <Table dataSource={items} pagination={false} rowKey="id" size="small"
                              columns={[
                                { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (v: string, it: any) => <code>{v || it.product?.sku}</code> },
                                { title: 'Product', dataIndex: 'name', key: 'name', render: (v: string, it: any) => v || it.product?.name },
                                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                                { title: 'Unit Price', dataIndex: 'price', key: 'price', render: (v: number) => `${v?.toLocaleString()} RWF` },
                                { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number, it: any) => <Text strong>{(v || it.price * it.quantity)?.toLocaleString()} RWF</Text> },
                              ]}
                              summary={() => (
                                <Table.Summary.Row>
                                  <Table.Summary.Cell index={0} colSpan={4} align="right"><strong>Order Total</strong></Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}><Text strong style={{ color: '#7c3aed', fontSize: '16px' }}>{wsSelectedOrder.totalAmount?.toLocaleString()} RWF</Text></Table.Summary.Cell>
                                </Table.Summary.Row>
                              )}
                            />
                          </Card>
                        </Col>
                      )}
                    </Row>
                  </>
                );
              })()}
            </Modal>
          </TabPane>

          {/* ── Suppliers tab ── */}
          <TabPane tab={<span><TeamOutlined /> Suppliers</span>} key="suppliers">
            <Table dataSource={accountData.suppliers || []} rowKey="id"
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Contact', dataIndex: 'contact', key: 'contact' },
                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              ]} pagination={false} />
          </TabPane>

          {/* ── Inventory Data tab — full wholesaler parity ── */}
          <TabPane tab={<span><ShopOutlined /> Inventory Data</span>} key="inventory">
            {/* Stats row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6} lg={6}>
                <Card size="small"><Statistic title="Total Products" value={wsInvStats.total_products} prefix={<AppstoreOutlined />} /></Card>
              </Col>
              <Col xs={12} sm={6} lg={6}>
                <Card size="small" style={{ borderLeft: '3px solid #fa8c16' }}>
                  <Statistic title="Stock Value (Supplier Cost)" value={wsInvStats.stock_value_supplier_cost} suffix="RWF"
                    prefix={<DollarOutlined style={{ color: '#fa8c16' }} />} formatter={(v) => v?.toLocaleString()} valueStyle={{ color: '#fa8c16', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>Based on supplier/manufacturer price</Text>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={6}>
                <Card size="small" style={{ borderLeft: '3px solid #7c3aed' }}>
                  <Statistic title="Stock Value (Wholesaler Price)" value={wsInvStats.stock_value_wholesaler_price} suffix="RWF"
                    prefix={<DollarOutlined style={{ color: '#7c3aed' }} />} formatter={(v) => v?.toLocaleString()} valueStyle={{ color: '#7c3aed', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>Based on selling price</Text>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={6}>
                <Card size="small" style={{ borderLeft: '3px solid #22c55e' }}>
                  <Statistic title="Profit Margin (Current Stock)" value={wsInvStats.stock_profit_margin} suffix="RWF"
                    prefix={<DollarOutlined style={{ color: '#22c55e' }} />} formatter={(v) => v?.toLocaleString()} valueStyle={{ color: '#22c55e', fontSize: '16px' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>Wholesaler price - Supplier cost</Text>
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 12 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col flex="auto">
                  <Space wrap size="middle">
                    <Input.Search placeholder="Search products..." allowClear style={{ width: 250 }}
                      onSearch={(v) => setWsInvSearchQuery(v)} onChange={(e) => { if (!e.target.value) setWsInvSearchQuery(''); }} />
                    <Select placeholder="Filter by Category" allowClear style={{ width: 200 }} value={wsInvCategoryFilter || undefined}
                      onChange={(v) => setWsInvCategoryFilter(v || '')}>
                      {wsInvCategories.map((cat: string) => <Select.Option key={cat} value={cat}>{cat}</Select.Option>)}
                    </Select>
                    <Button type={wsInvLowStockFilter ? 'primary' : 'default'} danger={wsInvLowStockFilter}
                      icon={<WarningOutlined />} onClick={() => setWsInvLowStockFilter(!wsInvLowStockFilter)}>Low Stock Only</Button>
                  </Space>
                </Col>
                <Col>
                  <Space size="middle">
                    <Card size="small" style={{ background: '#fff7ed', borderColor: '#fdba74' }}>
                      <Statistic title={<span style={{ fontSize: '12px' }}>Low Stock</span>} value={wsInvStats.low_stock_count}
                        prefix={<WarningOutlined style={{ fontSize: '14px', color: '#f97316' }} />} valueStyle={{ color: '#f97316', fontSize: '16px', fontWeight: 'bold' }} />
                    </Card>
                    <Card size="small" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                      <Statistic title={<span style={{ fontSize: '12px' }}>Out of Stock</span>} value={wsInvStats.out_of_stock_count}
                        prefix={<InboxOutlined style={{ fontSize: '14px', color: '#ef4444' }} />} valueStyle={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold' }} />
                    </Card>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Table */}
            <Card>
              <Table dataSource={wsInvFiltered} columns={wsInvColumns} rowKey="id" scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} products` }} />
            </Card>

            {/* ── Edit Product Modal ── */}
            <Modal title={`Edit Product: ${wsSelectedProduct?.name}`} open={wsEditModalOpen}
              onCancel={() => { setWsEditModalOpen(false); setWsSelectedProduct(null); wsInvForm.resetFields(); setWsFileList([]); }}
              onOk={handleWsUpdateProduct} confirmLoading={wsInvActionLoading} okText="Save Changes" width={600}>
              <Form form={wsInvForm} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="name" label="Product Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="category" label="Category" rules={[{ required: true }]}>
                    <Select>{wsInvCategories.map((c: string) => <Select.Option key={c} value={c}>{c}</Select.Option>)}</Select>
                  </Form.Item></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="low_stock_threshold" label="Low Stock Threshold" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="units">Units</Select.Option>
                      <Select.Option value="kg">Kilograms</Select.Option>
                      <Select.Option value="liters">Liters</Select.Option>
                      <Select.Option value="packs">Packs</Select.Option>
                      <Select.Option value="boxes">Boxes</Select.Option>
                    </Select>
                  </Form.Item></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="invoice_number" label="Wholesaler Invoice No."><Input placeholder="e.g. WHL-INV-001" /></Form.Item></Col>
                  <Col span={12}><Form.Item name="barcode" label="Barcode"><Input placeholder="Scan or enter barcode" /></Form.Item></Col>
                </Row>
                <Form.Item label="Product Image">
                  <Upload listType="picture-card" fileList={wsFileList} beforeUpload={() => false}
                    onChange={({ fileList }) => setWsFileList(fileList.slice(-1))} maxCount={1}>
                    {wsFileList.length < 1 && <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>}
                  </Upload>
                </Form.Item>
              </Form>
            </Modal>

            {/* ── Update Stock Modal ── */}
            <Modal title={`Update Stock: ${wsSelectedProduct?.name}`} open={wsStockModalOpen}
              onCancel={() => { setWsStockModalOpen(false); setWsSelectedProduct(null); wsInvForm.resetFields(); }}
              onOk={handleWsUpdateStock} confirmLoading={wsInvActionLoading} okText="Update Stock">
              {wsSelectedProduct && (
                <div style={{ marginBottom: 16 }}>
                  <Text>Current Stock: <strong>{wsSelectedProduct.stock} {wsSelectedProduct.unit || 'units'}</strong></Text>
                </div>
              )}
              <Form form={wsInvForm} layout="vertical">
                <Form.Item name="type" label="Action Type" rules={[{ required: true, message: 'Select action type' }]}>
                  <Select placeholder="Select action">
                    <Select.Option value="add">Add Stock</Select.Option>
                    <Select.Option value="remove">Remove Stock</Select.Option>
                    <Select.Option value="set">Set Exact Quantity</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Enter quantity' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="reason" label="Reason">
                  <Input.TextArea rows={2} placeholder="Optional reason for stock adjustment" />
                </Form.Item>
              </Form>
            </Modal>
          </TabPane>
        </Tabs>
      </>
    );
  };


  const getAccountIcon = () => {

    switch (accountType) {
      case 'customer': return <UserOutlined />;
      case 'retailer': return <ShopOutlined />;
      case 'worker': return <IdcardOutlined />;
      case 'wholesaler': return <BankOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getAccountTitle = () => {
    switch (accountType) {
      case 'customer': return accountData.profile?.fullName || 'Customer';
      case 'retailer': return accountData.profile?.shopName || 'Retailer';
      case 'worker': return accountData.profile?.name || 'Employee';
      case 'wholesaler': return accountData.profile?.companyName || 'Wholesaler';
      default: return 'Account';
    }
  };

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Avatar size={48} icon={getAccountIcon()} style={{ backgroundColor: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>{getAccountTitle()}</Title>
              <Space>
                <Tag color="blue">{accountType.toUpperCase()}</Tag>
                <Tag color={accountData.profile?.isActive ? 'green' : 'red'}>
                  {accountData.profile?.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {accountData.profile?.isVerified && <Tag color="cyan">Verified</Tag>}
              </Space>
            </div>
          </Space>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh}>
            Refresh Data
          </Button>
        </Col>
      </Row>

      {/* READ-ONLY Alert */}
      <Alert
        message="Read-Only View"
        description="This is a real-time read-only view of the account. Admin CANNOT edit, recharge, place orders, request loans, or change balances."
        type="warning"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Profile Info */}
      <Card title="Profile Information" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="ID">{accountData.profile?.id}</Descriptions.Item>
          <Descriptions.Item label="Phone"><span style={{ whiteSpace: 'nowrap' }}>{accountData.profile?.phone}</span></Descriptions.Item>
          <Descriptions.Item label="Email">{accountData.profile?.email || 'N/A'}</Descriptions.Item>
          {accountData.profile?.address && (
            <Descriptions.Item label="Address">{accountData.profile.address}</Descriptions.Item>
          )}
          <Descriptions.Item label="Created">
            {dayjs(accountData.profile?.createdAt).format('MMM DD, YYYY')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Type-specific content */}
      {accountType === 'customer' && renderCustomerAccount()}
      {accountType === 'retailer' && renderRetailerAccount()}
      {accountType === 'worker' && renderWorkerAccount()}
      {accountType === 'wholesaler' && renderWholesalerAccount()}

      {/* Last Order */}
      {accountData.lastOrder && (
        <Card title="Last Order Details" style={{ marginTop: 24 }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Order ID">{accountData.lastOrder.id}</Descriptions.Item>
            <Descriptions.Item label="Amount">{accountData.lastOrder.totalAmount?.toLocaleString()} RWF</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(accountData.lastOrder.status)}</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(accountData.lastOrder.createdAt).format('MMM DD, YYYY HH:mm')}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
      {/* Order Details Modal */}
      <Modal
        title={`Order #${selectedOrder?.id}`}
        open={showOrderModal}
        onCancel={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        footer={[
          selectedOrder && (
            <Button
              key="print"
              icon={<PrinterOutlined />}
              onClick={() => {
                const order = selectedOrder;
                const printWindow = window.open('', '_blank');
                if (!printWindow) { message.error('Please allow popups to print'); return; }
                const htmlContent = `
                  <html>
                  <head>
                    <title>Order Receipt #${order.id}</title>
                    <style>
                      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                      .company-name { font-size: 24px; font-weight: bold; margin: 0; }
                      .receipt-title { font-size: 16px; color: #666; margin: 5px 0 0 0; }
                      .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                      .info-group { flex: 1; }
                      .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
                      .value { font-size: 14px; font-weight: 500; margin-top: 4px; }
                      .right-align { text-align: right; }
                      
                      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                      th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px 0; font-size: 12px; text-transform: uppercase; color: #666; }
                      td { border-bottom: 1px solid #f5f5f5; padding: 12px 0; font-size: 14px; }
                      .total-row td { border-bottom: none; border-top: 2px solid #333; font-weight: bold; font-size: 16px; padding-top: 15px; }
                      .subtotal-row td { border-bottom: none; color: #666; padding-top: 5px; padding-bottom: 5px; }
                      
                      .footer { text-align: center; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div style="display: flex; justify-content: center; align-items: center; height: 70px; margin: 0 auto 8px;">
                        <img src="/logo-big.png" alt="BIG" style="height: 100%; max-width: 100%; object-fit: contain;" />
                      </div>
                      <h1 class="company-name">Big Innovation Group Ltd</h1>
                      <p style="margin: 2px 0; color: #666; font-size: 13px;">Kigali, Rwanda | +250788541239 | info@big.co.rw</p>
                      <p class="receipt-title">Order Receipt</p>
                    </div>

                    <div class="info-grid">
                      <div class="info-group">
                        <div class="label">Customer</div>
                        <div class="value">${order.consumerProfile?.fullName || 'Walk-in Customer'}</div>
                        <div class="value">${order.consumerProfile?.user?.phone || 'N/A'}</div>
                      </div>
                      <div class="info-group right-align">
                        <div class="label">Order Details</div>
                        <div class="value">#${order.id}</div>
                        <div class="value">${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</div>
                        <div class="value" style="margin-top: 5px;">
                          <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${order.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th style="width: 50%">Item</th>
                          <th style="width: 15%; text-align: center;">Qty</th>
                          <th style="width: 15%; text-align: right;">Price</th>
                          <th style="width: 20%; text-align: right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(order.saleItems || []).map((item: any) => `
                          <tr>
                            <td>
                              <div style="font-weight: 500;">${item.product?.name || item.productName || 'Unknown Product'}</div>
                              <div style="font-size: 11px; color: #888;">SKU: ${item.product?.sku || 'N/A'}</div>
                            </td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${item.price?.toLocaleString()}</td>
                            <td style="text-align: right;">${(item.price * item.quantity).toLocaleString()} RWF</td>
                          </tr>
                        `).join('')}
                        
                        <tr class="subtotal-row">
                          <td colspan="3" style="text-align: right;">Subtotal</td>
                          <td style="text-align: right;">${order.totalAmount?.toLocaleString()} RWF</td>
                        </tr>
                        <tr class="total-row">
                          <td colspan="3" style="text-align: right;">Total</td>
                          <td style="text-align: right;">${order.totalAmount?.toLocaleString()} RWF</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="footer">
                      <p>Thank you for your business!</p>
                      <p>BIG Company Rwanda Distribution Platform</p>
                    </div>
                    
                    <script>
                      window.onload = function() { window.print(); window.close(); }
                    </script>
                  </body>
                  </html>
                `;
                printWindow.document.write(htmlContent);
                printWindow.document.close();
              }}
            >
              Print
            </Button>
          ),
          <Button key="close" onClick={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedOrder && (() => {
          const statusIdx = ['pending', 'processing', 'shipped', 'completed', 'delivered'].indexOf(selectedOrder.status?.toLowerCase());
          const stepVal = statusIdx >= 3 ? 3 : (statusIdx >= 0 ? statusIdx : 0);
          
          const pmLabels: Record<string, string> = {
            dashboard_wallet: 'Dashboard Wallet', credit_wallet: 'Credit Wallet',
            mobile_money: 'Mobile Money', cash: 'Cash', wallet: 'Wallet',
            nfc: 'NFC Card', credit: 'Credit',
          };
          const pmColors: Record<string, string> = {
            dashboard_wallet: 'blue', credit_wallet: 'purple', mobile_money: 'gold',
            cash: 'green', wallet: 'blue', nfc: 'purple', credit: 'orange',
          };

          return (
            <div>
              {/* Status Steps */}
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'rejected' && (
                <Steps
                  current={stepVal}
                  size="small"
                  style={{ marginBottom: 24 }}
                  items={[
                    { title: 'Pending' },
                    { title: 'Proceed' },
                    { title: 'Shipped' },
                    { title: 'Delivered' },
                  ]}
                />
              )}

              {/* Cancelled Banner */}
              {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'rejected') && (
                <div style={{ background: '#fff1f0', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #ffa39e' }}>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  <Text strong style={{ color: '#ff4d4f' }}>Order Cancelled</Text>
                  {selectedOrder.notes && (
                    <div><Text type="secondary">Reason: {selectedOrder.notes}</Text></div>
                  )}
                </div>
              )}

              {/* Shipped Information Banner */}
              {selectedOrder.shipperName && (
                <div style={{ background: '#f9f0ff', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #d3adf7' }}>
                  <TruckOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                  <Text strong style={{ color: '#722ed1' }}>Shipping Information</Text>
                  <Descriptions size="small" column={2} style={{ marginTop: 8 }}>
                    <Descriptions.Item label="Shipper">{selectedOrder.shipperName}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedOrder.shipperPhone}</Descriptions.Item>
                    <Descriptions.Item label="Vehicle Plate">{selectedOrder.vehiclePlate}</Descriptions.Item>
                  </Descriptions>
                </div>
              )}

              <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Customer">{selectedOrder.consumerProfile?.fullName || 'Walk-in Customer'}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedOrder.consumerProfile?.user?.phone || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Payment">
                  <Tag color={pmColors[selectedOrder.paymentMethod] || 'blue'}>
                    {pmLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={orderStatusColors[selectedOrder.status?.toLowerCase()] || 'blue'}>
                    {orderStatusLabels[selectedOrder.status?.toLowerCase()] || selectedOrder.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created">{new Date(selectedOrder.createdAt).toLocaleString()}</Descriptions.Item>
                {selectedOrder.notes && (
                  <Descriptions.Item label="Retailer Comments" span={2}>
                    <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 4, width: '100%' }}>
                      <Text italic>{selectedOrder.notes}</Text>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Table
                dataSource={selectedOrder.saleItems || []}
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, record: any) => (
                      <Space>
                        {record.product?.image ? (
                          <img
                            src={record.product.image}
                            alt={record.product.name}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                          </div>
                        )}
                        <div>
                          <Text strong>{record.product?.name || record.productName || 'Unknown Product'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>SKU: {record.product?.sku || 'N/A'}</Text>
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center',
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (value: number) => `${value?.toLocaleString()} RWF`,
                    align: 'right',
                  },
                  {
                    title: 'Total',
                    key: 'total',
                    render: (_, record: any) => <Text strong>{((record.price || 0) * (record.quantity || 0))?.toLocaleString()} RWF</Text>,
                    align: 'right',
                  },
                ]}
                summary={() => (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}><Text>Subtotal</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text>{selectedOrder.totalAmount?.toLocaleString()} RWF</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}><Title level={5} style={{ margin: 0 }}>Total</Title></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Title level={5} style={{ margin: 0, color: '#0ea5e9' }}>
                          {selectedOrder.totalAmount?.toLocaleString()} RWF
                        </Title>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )}
              />
            </div>
          );
        })()}
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
            dataSource={accountData?.products || []}
            renderItem={(product: any) => {
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
                        SKU: {product.sku} | Barcode: {product.barcode || product.sku || 'N/A'} | Price: {(product.retailerPrice || product.price || 0)?.toLocaleString()} RWF
                      </Text>
                    </div>
                  </Checkbox>
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AccountDetailsPage;
