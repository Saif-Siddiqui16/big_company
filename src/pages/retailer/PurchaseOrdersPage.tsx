import { useState, useEffect } from 'react';
import {
  Table,
  Space,
  Card,
  Typography,
  Descriptions,
  Button,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Badge,
  Empty,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MobileOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface PurchaseOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface PurchaseOrder {
  id: number;
  wholesaler_name: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items_count: number;
  items?: PurchaseOrderItem[];
  shipper_name?: string;
  shipper_phone?: string;
  vehicle_plate?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  pending_payment: 'gold',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
};

const paymentIcons: Record<string, React.ReactNode> = {
  wallet: <DollarOutlined />,
  credit: <BankOutlined />,
  momo: <MobileOutlined />,
};

const paymentLabels: Record<string, string> = {
  wallet: 'Capital Wallet',
  credit: 'Wholesaler Credit',
  momo: 'Mobile Money',
};

export const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // View Modal
  const [viewModal, setViewModal] = useState<{ visible: boolean; order: PurchaseOrder | null }>({
    visible: false,
    order: null,
  });
  const [viewLoading, setViewLoading] = useState(false);
  const [retailerProfile, setRetailerProfile] = useState<any>(null);

  useEffect(() => {
    loadOrders();
    loadProfile();
  }, [statusFilter, pagination.current]);

  const loadProfile = async () => {
    try {
      const response = await retailerApi.getProfile();
      setRetailerProfile(response.data.retailer || response.data);
    } catch (error) {
      console.error('Failed to load retailer profile:', error);
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await retailerApi.getPurchaseOrders({
        status: statusFilter || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });

      setOrders(response.data.orders || []);
      setPagination((prev) => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      message.error('Failed to load purchase history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    setViewLoading(true);
    setViewModal({ visible: true, order: null });
    try {
      const response = await retailerApi.getPurchaseOrder(orderId.toString());
      setViewModal({ visible: true, order: response.data.order });
    } catch (error) {
      console.error('Failed to load order details:', error);
      message.error('Failed to load order details');
      setViewModal({ visible: false, order: null });
    } finally {
      setViewLoading(false);
    }
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirmDelivery = async (orderId: number) => {
    setConfirming(true);
    try {
      await retailerApi.confirmPurchaseOrder(orderId.toString());
      message.success('Order marked as delivered');
      // Reload order detail to show new status
      loadOrderDetail(orderId);
      // Reload the list too
      loadOrders(true);
    } catch (error: any) {
      console.error('Failed to confirm delivery:', error);
      message.error(error.response?.data?.error || 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  };

  const handlePrint = () => {
    if (!viewModal.order) return;

    const order = viewModal.order;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Please allow popups to print');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order Receipt #${order.id}</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
          .logo-wrapper { position: relative; height: 120px; overflow: hidden; width: 300px; margin: 0 auto 5px; }
          .logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(2.0); width: 100%; object-fit: contain; }
          .company-name { font-size: 26px; font-weight: 800; margin: 0; color: #111827; letter-spacing: -0.025em; position: relative; z-index: 10; }
          .receipt-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .section-title { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
          .info-text { font-size: 14px; margin-bottom: 4px; }
          .info-label { font-weight: 600; color: #4b5563; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 12px 16px; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; }
          td { border-bottom: 1px solid #f3f4f6; padding: 16px; font-size: 14px; }
          
          .totals-container { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .grand-total { border-top: 2px solid #111827; margin-top: 12px; padding-top: 12px; font-size: 20px; font-weight: 800; color: #111827; }
          
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #f3f4f6; color: #4b5563; }
          .status-delivered { background: #dcfce7; color: #166534; }
          
          .footer { text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-wrapper">
            <img src="/logo-big.png" alt="BIG" class="logo" />
          </div>
          <h1 class="company-name">Big Innovation Group Ltd</h1>
          <p class="receipt-title">Stock Purchase Receipt</p>
        </div>

        <div class="info-grid">
          <div>
            <div class="section-title">From (Wholesaler)</div>
            <div class="info-text"><span class="info-label">${order.wholesaler_name}</span></div>
            <div class="info-text">Authorized Wholesale Partner</div>
          </div>
          <div style="text-align: right;">
            <div class="section-title">Order Details</div>
            <div class="info-text"><span class="info-label">Order Reference:</span> #${order.id}</div>
            <div class="info-text"><span class="info-label">Date:</span> ${new Date(order.created_at).toLocaleString()}</div>
            <div class="info-text"><span class="info-label">Status:</span> <span class="status-badge ${order.status === 'delivered' ? 'status-delivered' : ''}">${order.status.toUpperCase()}</span></div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div class="section-title">To (Retailer)</div>
            <div class="info-text"><span class="info-label">${retailerProfile?.name || 'Retailer Store'}</span></div>
            <div class="info-text">${retailerProfile?.phone || ''}</div>
            <div class="info-text">${retailerProfile?.address || ''}</div>
          </div>
          <div style="text-align: right;">
            <div class="section-title">Payment & Delivery</div>
            <div class="info-text"><span class="info-label">Payment Method:</span> ${paymentLabels[order.payment_method] || order.payment_method}</div>
            ${order.shipper_name ? `<div class="info-text"><span class="info-label">Driver:</span> ${order.shipper_name}</div>` : ''}
            ${order.vehicle_plate ? `<div class="info-text"><span class="info-label">Vehicle:</span> ${order.vehicle_plate}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td><strong>${item.product_name}</strong></td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.price.toLocaleString()} RWF</td>
                <td style="text-align: right;"><strong>${item.total.toLocaleString()} RWF</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-container">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${order.total_amount.toLocaleString()} RWF</span>
          </div>
          <div class="total-row grand-total">
            <span>Amount Paid</span>
            <span>${order.total_amount.toLocaleString()} RWF</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business. This is an official electronic receipt.</p>
          <p>Big Innovation Group Ltd | Kigali, Rwanda</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
            // Optional: window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString(),
    },
    {
      title: 'Wholesaler',
      dataIndex: 'wholesaler_name',
      key: 'wholesaler_name',
      render: (name: string) => (
        <Space>
          <BankOutlined />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>{amount.toLocaleString()} RWF</Text>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => (
        <Tag icon={paymentIcons[method]} color="blue">
          {paymentLabels[method] || method.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PurchaseOrder) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => loadOrderDetail(record.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Stock Purchase History</Title>
          <Text type="secondary">View and track your wholesale orders</Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadOrders(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="pending_payment">Pending Payment</Select.Option>
              <Select.Option value="processing">Processing</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      <Modal
        title={`Purchase Order #${viewModal.order?.id}`}
        open={viewModal.visible}
        onCancel={() => setViewModal({ visible: false, order: null })}
        footer={[
          <Button key="close" onClick={() => setViewModal({ visible: false, order: null })}>
            Close
          </Button>,
          viewModal.order && (
            <Button 
              key="print" 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
          ),
          (viewModal.order?.status === 'shipped' || viewModal.order?.status === 'confirmed' || viewModal.order?.status === 'processing') && (
            <Button 
              key="confirm" 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmDelivery(viewModal.order!.id)}
              loading={confirming}
            >
              Confirm Delivery
            </Button>
          )
        ]}
        width={800}
      >
        {viewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : viewModal.order ? (
          <div>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Descriptions title="Order Info" column={1} bordered size="small">
                  <Descriptions.Item label="Wholesaler">{viewModal.order.wholesaler_name}</Descriptions.Item>
                  <Descriptions.Item label="Date">{new Date(viewModal.order.created_at).toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Payment">{paymentLabels[viewModal.order.payment_method] || viewModal.order.payment_method}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={statusColors[viewModal.order.status] || 'default'}>
                      {viewModal.order.status.toUpperCase() === 'CONFIRMED' ? 'PROCEED' : viewModal.order.status.toUpperCase().replace('_', ' ')}
                    </Tag>
                  </Descriptions.Item>
                  {viewModal.order.shipper_name && (
                    <Descriptions.Item label="Shipper Name">{viewModal.order.shipper_name}</Descriptions.Item>
                  )}
                  {viewModal.order.shipper_phone && (
                    <Descriptions.Item label="Shipper Phone">{viewModal.order.shipper_phone}</Descriptions.Item>
                  )}
                  {viewModal.order.vehicle_plate && (
                    <Descriptions.Item label="Vehicle Plate">{viewModal.order.vehicle_plate}</Descriptions.Item>
                  )}
                  {viewModal.order.rejection_reason && (
                    <Descriptions.Item label="Rejection Reason">
                      <Text type="danger">{viewModal.order.rejection_reason}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'right', background: '#f0f5ff' }}>
                  <Text type="secondary">Total Amount</Text>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    {viewModal.order.total_amount.toLocaleString()} RWF
                  </Title>
                </Card>
              </Col>
            </Row>

            <Divider>Order Items</Divider>
            
            <Table
              dataSource={viewModal.order.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { 
                  title: 'Product', 
                  key: 'product',
                  render: (_, record) => (
                    <Space>
                      {record.image ? (
                        <img 
                          src={record.image} 
                          alt={record.product_name} 
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                        </div>
                      )}
                      <Text strong>{record.product_name}</Text>
                    </Space>
                  )
                },
                { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `${val.toLocaleString()} RWF` },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => <Text strong>{val.toLocaleString()} RWF</Text> },
              ]}
            />
          </div>
        ) : (
          <Empty />
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
