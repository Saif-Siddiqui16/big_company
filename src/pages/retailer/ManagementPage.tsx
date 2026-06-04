import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message as antMessage,
  Tabs,
  Statistic,
  Divider,
  Alert,
  List,
  Avatar,
  Badge,
  Empty,
} from 'antd';
import {
  CreditCardOutlined,
  SearchOutlined,
  UserOutlined,
  WalletOutlined,
  FireOutlined,
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { nfcApi, retailerApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;

interface CardTransaction {
  id: string;
  card_id: string;
  card_last4: string;
  order_id: string;
  customer_name: string;
  amount: number;
  payment_type: 'dashboard' | 'credit';
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface GasReward {
  id: string;
  meter_id: string;
  customer_name: string;
  order_id: string;
  gas_amount_m3: number;
  order_amount: number;
  date: string;
}

interface ProfitInvoice {
  id: string;
  invoice_number: string;
  period: string;
  gross_profit: number;
  monthly_expenses: number;
  net_profit: number;
  status: 'paid' | 'pending';
  date: string;
}

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance-check');
  const [balanceCheckModalVisible, setBalanceCheckModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ProfitInvoice | null>(null);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [gasRewards, setGasRewards] = useState<GasReward[]>([]);
  const [profitInvoices, setProfitInvoices] = useState<ProfitInvoice[]>([]);
  const [rewardStats, setRewardStats] = useState({ totalM3: 0, totalValue: 0 });
  const [fetchingData, setFetchingData] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = antMessage.useMessage();

  const fetchData = async () => {
    setFetchingData(true);
    try {
      const [txRes, rewardRes, invoiceRes] = await Promise.all([
        retailerApi.getPaymentAuditLogs({ limit: 50 }),
        retailerApi.getGasRewards({ limit: 50 }),
        retailerApi.getSettlementInvoices()
      ]);

      if (txRes.data.success) {
        // Map audit logs to CardTransaction interface
        const formattedTxs = txRes.data.data.map((log: any) => ({
          id: log.id.toString(),
          card_id: log.cardId,
          card_last4: log.cardId.slice(-4),
          order_id: log.orderId ? `ORD-${log.orderId}` : 'N/A',
          customer_name: log.customerName || 'N/A',
          amount: log.amount,
          payment_type: log.method === 'credit' ? 'credit' : 'dashboard',
          date: log.createdAt,
          status: 'completed'
        }));
        setCardTransactions(formattedTxs);
      }

      if (rewardRes.data.success) {
        setGasRewards(rewardRes.data.rewards);
        setRewardStats(rewardRes.data.stats);
      }

      if (invoiceRes.data.success) {
        // Map settlement invoices to ProfitInvoice interface
        const formattedInvoices = invoiceRes.data.invoices.map((inv: any) => ({
          id: inv.id.toString(),
          invoice_number: inv.invoiceNumber,
          period: inv.settlementMonth,
          gross_profit: inv.totalAmount,
          monthly_expenses: 0, // Not explicitly in settlement invoice yet
          net_profit: inv.totalAmount,
          status: 'paid',
          date: inv.createdAt
        }));
        setProfitInvoices(formattedInvoices);
      }
    } catch (error) {
      console.error('Error fetching management data:', error);
      messageApi.error('Failed to load management data');
    } finally {
      setFetchingData(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const totalGasRewards = rewardStats.totalM3;
  const totalGasValue = rewardStats.totalValue;

  const handleBalanceCheck = async (values: any) => {
    setLoading(true);
    try {
      const response = await nfcApi.checkCardBalance(values.card_uid, values.card_pin);
      if (response.data.success) {
        setCustomerBalance(response.data.data);
        messageApi.success('Balance retrieved successfully');
      } else {
        messageApi.error(response.data.error || 'Failed to retrieve balance');
      }
    } catch (error: any) {
      console.error('Balance check failed:', error);
      messageApi.error(error.response?.data?.error || 'Failed to verify card. Please check UID and PIN.');
    } finally {
      setLoading(false);
    }
  };

  const cardTransactionColumns: ColumnsType<CardTransaction> = [
    {
      title: 'Card ID',
      key: 'card',
      render: (_, record) => (
        <Space>
          <CreditCardOutlined style={{ color: '#1890ff' }} />
          <Text>****{record.card_last4}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Payment Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      render: (type) => (
        <Tag color={type === 'dashboard' ? 'blue' : 'purple'}>
          {type === 'dashboard' ? 'Dashboard Wallet' : 'Credit Wallet'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, HH:mm'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />}>View Invoice</Button>
      ),
    },
  ];

  const gasRewardColumns: ColumnsType<GasReward> = [
    {
      title: 'Meter ID',
      dataIndex: 'meter_id',
      key: 'meter_id',
      render: (id) => (
        <Space>
          <FireOutlined style={{ color: '#fa541c' }} />
          <Text code>{id}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: 'Order Amount',
      dataIndex: 'order_amount',
      key: 'order_amount',
      render: (amount) => `${amount.toLocaleString()} RWF`,
    },
    {
      title: 'Gas Reward',
      dataIndex: 'gas_amount_m3',
      key: 'gas_amount_m3',
      render: (amount) => (
        <Tag color="orange">{amount.toFixed(2)} M³</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, HH:mm'),
    },
  ];

  const profitInvoiceColumns: ColumnsType<ProfitInvoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (num) => <Text strong>{num}</Text>,
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Gross Profit',
      dataIndex: 'gross_profit',
      key: 'gross_profit',
      render: (amount) => <Text>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Expenses',
      dataIndex: 'monthly_expenses',
      key: 'monthly_expenses',
      render: (amount) => <Text type="danger">-{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Net Profit',
      dataIndex: 'net_profit',
      key: 'net_profit',
      render: (amount) => <Text strong style={{ color: '#52c41a' }}>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'success' : 'warning'} icon={status === 'paid' ? <CheckCircleOutlined /> : null}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => {
          setSelectedInvoice(record);
          setInvoiceModalVisible(true);
        }}>
          View Details
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'balance-check',
      label: (
        <span>
          <WalletOutlined /> Customer Balance Check
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Check Customer Wallet Balance">
              <Alert
                title="Customer Balance Verification"
                description="Help customers check their wallet balance by entering their card PIN and wallet PIN."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              <Form form={form} layout="vertical" onFinish={handleBalanceCheck}>
                <Form.Item
                  name="card_uid"
                  label="Customer Card UID"
                  rules={[{ required: true, message: 'Enter customer card UID' }]}
                >
                  <Input
                    prefix={<CreditCardOutlined />}
                    placeholder="Enter or scan card UID"
                  />
                </Form.Item>
                <Form.Item
                  name="card_pin"
                  label="Customer Card PIN"
                  rules={[{ required: true, message: 'Enter customer card PIN' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter 4-digit card PIN"
                    maxLength={4}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block icon={<SearchOutlined />} loading={loading}>
                    Check Balance
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Balance Result">
              {customerBalance ? (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Alert title={`Card ending in ****${customerBalance.card_number}`} type="success" showIcon />
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Dashboard Balance"
                        value={customerBalance.dashboard_balance}
                        suffix="RWF"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Credit Balance"
                        value={customerBalance.credit_balance}
                        suffix="RWF"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                  </Row>
                  <Divider />
                  <Statistic
                    title="Available Balance"
                    value={customerBalance.available_balance}
                    suffix="RWF"
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                  />
                </Space>
              ) : (
                <Empty description="Enter customer credentials to check balance" />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'card-transactions',
      label: (
        <span>
          <CreditCardOutlined /> Card Transactions
        </span>
      ),
      children: (
        <Card
          title="Store Card Transactions"
          extra={
            <Space>
              <Tag color="blue">Dashboard: {cardTransactions.filter(t => t.payment_type === 'dashboard').length}</Tag>
              <Tag color="purple">Credit: {cardTransactions.filter(t => t.payment_type === 'credit').length}</Tag>
            </Space>
          }
        >
          <Table
            columns={cardTransactionColumns}
            dataSource={cardTransactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={fetchingData}
          />
        </Card>
      ),
    },
    {
      key: 'gas-rewards',
      label: (
        <span>
          <FireOutlined /> Gas Rewards Given
        </span>
      ),
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total Gas Rewards Given"
                  value={totalGasRewards.toFixed(2)}
                  suffix="M³"
                  prefix={<FireOutlined style={{ color: '#fa541c' }} />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Estimated Value"
                  value={totalGasValue}
                  suffix="RWF"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Card title="Gas Rewards History">
            <Table
              columns={gasRewardColumns}
              dataSource={gasRewards}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={fetchingData}
            />
          </Card>
        </>
      ),
    },
    {
      key: 'profit-invoices',
      label: (
        <span>
          <FileTextOutlined /> Profit Invoices
        </span>
      ),
      children: (
        <Card
          title="Monthly Profit Invoices from Admin"
          extra={<Text type="secondary">Net profit transferred to your bank account after expenses</Text>}
        >
          <Alert
            title="Profit Distribution"
            description="Each month, admin calculates your net profit after deducting monthly expenses and transfers it to your registered bank account."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Table
            columns={profitInvoiceColumns}
            dataSource={profitInvoices}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={fetchingData}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Title level={3} style={{ marginBottom: 24 }}>
        <CreditCardOutlined style={{ marginRight: 12 }} />
        My Management
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* Invoice Detail Modal */}
      <Modal
        title={`Invoice Details - ${selectedInvoice?.invoice_number}`}
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={<Button onClick={() => setInvoiceModalVisible(false)}>Close</Button>}
        width={500}
      >
        {selectedInvoice && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Row justify="space-between">
              <Text type="secondary">Period:</Text>
              <Text strong>{selectedInvoice.period}</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Gross Profit:</Text>
              <Text strong>{selectedInvoice.gross_profit.toLocaleString()} RWF</Text>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Title level={5}>Monthly Expenses Breakdown</Title>
            <Row justify="space-between">
              <Text>Rent & Utilities:</Text>
              <Text>100,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text>Staff Salaries:</Text>
              <Text>80,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text>System Fee:</Text>
              <Text>50,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Total Expenses:</Text>
              <Text type="danger">-{selectedInvoice.monthly_expenses.toLocaleString()} RWF</Text>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Row justify="space-between">
              <Text strong>Net Profit Transferred:</Text>
              <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                {selectedInvoice.net_profit.toLocaleString()} RWF
              </Text>
            </Row>
            <Alert
              title={selectedInvoice.status === 'paid' ? 'Transferred to Bank' : 'Pending Transfer'}
              type={selectedInvoice.status === 'paid' ? 'success' : 'warning'}
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ManagementPage;
