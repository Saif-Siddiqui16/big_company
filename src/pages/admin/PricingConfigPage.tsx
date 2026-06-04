import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Form,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Statistic,
  Alert,
  Tag,
  Modal,
  Table,
  Switch,
  Popconfirm
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  SaveOutlined,
  PercentageOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  EditOutlined,
  LockOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  CreditCardOutlined,
  FireOutlined,
  GiftOutlined,
  BankOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;

const PricingConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm] = Form.useForm();

  useEffect(() => {
    loadConfig();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const response = await adminApi.getGasPricingPlans();
      if (response.data?.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch gas pricing plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSystemConfig();
      if (response.data?.config) {
        setConfig(response.data.config);
        form.setFieldsValue(response.data.config);
      }
    } catch (error: any) {
      console.error('Failed to load config:', error);
      message.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await adminApi.updateSystemConfig(values);
      message.success('Settings updated successfully');
      setIsEditing(false);
      setIsModalVisible(false);
      loadConfig();
    } catch (error: any) {
      message.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = () => {
    modalForm.setFieldsValue(config);
    setIsModalVisible(true);
  };

  const handlePlanSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingPlan) {
        await adminApi.updateGasPricingPlan(editingPlan.id, values);
        message.success('Plan updated successfully');
      } else {
        await adminApi.createGasPricingPlan(values);
        message.success('Plan created successfully');
      }
      setIsPlanModalVisible(false);
      setEditingPlan(null);
      planForm.resetFields();
      fetchPlans();
    } catch (error) {
      message.error('Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: number) => {
    try {
      await adminApi.deleteGasPricingPlan(id);
      message.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      message.error('Failed to delete plan');
    }
  };

  const togglePlanStatus = async (plan: any) => {
    try {
      await adminApi.updateGasPricingPlan(plan.id, { isActive: !plan.isActive });
      message.success(`Plan ${plan.isActive ? 'disabled' : 'enabled'} successfully`);
      fetchPlans();
    } catch (error) {
      message.error('Failed to update plan status');
    }
  };

  const showPlanModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      planForm.setFieldsValue(plan);
    } else {
      setEditingPlan(null);
      planForm.resetFields();
    }
    setIsPlanModalVisible(true);
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      {/* Orange Header Banner */}
      <Card bordered={false} style={{ 
        background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(245, 124, 0, 0.2)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="start">
              <SettingOutlined style={{ color: 'white', fontSize: 32, marginTop: 4 }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Pricing & System Configuration</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Configure pricing, margins, rewards, and transaction limits</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadConfig}
              style={{ borderRadius: '8px', height: '40px' }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        {/* Profit Margin Section */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <PercentageOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
              Profit Margin Settings
            </Title>
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={showEditModal}
              style={{ color: '#1890ff', fontWeight: 500 }}
            >
              Edit
            </Button>
          </div>

          <Alert
            title="Profit Distribution Model"
            description="Configure how profits are distributed between retailers, company, and gas rewards."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#e3f2fd', border: '1px solid #90caf9' }}
          />

          <Row gutter={16}>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#e1f5fe' }}>
                <Form.Item name="retailerShare" label="Retailer Share (%)" style={{ margin: 0 }}>
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}%`}
                    parser={value => value!.replace('%', '')}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#fff3e0' }}>
                <Form.Item name="companyShare" label="Company Share (%)">
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}%`}
                    parser={value => value!.replace('%', '')}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#f1f8e9' }}>
                <Form.Item name="gasRewardShare" label="Gas Reward (%)">
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}% - M³`}
                    parser={value => value!.replace('% - M³', '')}
                    disabled
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Loan Interest Rates Section */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <BankOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
              Loan Interest Rates Configuration
            </Title>
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={showEditModal}
              style={{ color: '#722ed1', fontWeight: 500 }}
            >
              Configure Rates
            </Button>
          </div>

          <Alert
            title="Multi-Party Interest Settings"
            description="Configure distinct interest rates dynamically applied to loans granted across customer, retailer, and wholesaler segments."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#f9f0ff', border: '1px solid #d3adf7' }}
          />

          <Row gutter={16}>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#f9f0ff' }}>
                <Form.Item name="customerLoanInterest" label="Customer Loan Interest (%)" style={{ margin: 0 }}>
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }} 
                    formatter={value => `${value !== undefined ? value : 0}%`}
                    parser={value => value!.replace('%', '')}
                    readOnly
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#e6fffb' }}>
                <Form.Item name="retailerLoanInterest" label="Retailer Loan Interest (%)" style={{ margin: 0 }}>
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold', color: '#13c2c2' }} 
                    formatter={value => `${value !== undefined ? value : 0}%`}
                    parser={value => value!.replace('%', '')}
                    readOnly
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card variant="borderless" style={{ borderRadius: '12px', background: '#fff0f6' }}>
                <Form.Item name="wholesalerLoanInterest" label="Wholesaler Loan Interest (%)" style={{ margin: 0 }}>
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }} 
                    formatter={value => `${value !== undefined ? value : 0}%`}
                    parser={value => value!.replace('%', '')}
                    readOnly
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </section>

        <Row gutter={24}>
          {/* Gas Pricing Column */}
          <Col span={12}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
                  Gas Pricing
                </Title>
                {!isEditing && (
                  <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                )}
                {isEditing && (
                  <Space>
                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading} style={{ background: '#f57c00', borderColor: '#f57c00' }}>Save</Button>
                  </Space>
                )}
              </div>
              <Card variant="borderless" style={{ borderRadius: '12px' }}>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Price per M³</Text></Col>
                  <Col>
                    <Form.Item name="gasPricePerM3" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Min Top-up</Text></Col>
                  <Col>
                    <Form.Item name="minGasTopup" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0' }}>
                  <Col><Text type="secondary">Max Top-up</Text></Col>
                  <Col>
                    <Form.Item name="maxGasTopup" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </section>
          </Col>

          {/* Transaction Limits Column */}
          <Col span={12}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <ThunderboltOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
                  Transaction Limits
                </Title>
                {!isEditing && (
                  <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                )}
                {isEditing && (
                  <Space>
                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading} style={{ background: '#f57c00', borderColor: '#f57c00' }}>Save</Button>
                  </Space>
                )}
              </div>
              <Card variant="borderless" style={{ borderRadius: '12px' }}>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Min Wallet Top-up</Text></Col>
                  <Col>
                    <Form.Item name="minWalletTopup" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Max Wallet Top-up</Text></Col>
                  <Col>
                    <Form.Item name="maxWalletTopup" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Max Daily Transaction</Text></Col>
                  <Col>
                    <Form.Item name="maxDailyTransaction" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0' }}>
                  <Col><Text type="secondary">Max Credit Limit</Text></Col>
                  <Col>
                    <Form.Item name="maxCreditLimit" style={{ margin: 0 }}>
                      <InputNumber 
                        style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} 
                        formatter={value => `${value} RWF`}
                        parser={value => value!.replace(/\s?RWF/g, '')}
                        disabled={!isEditing} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </section>
          </Col>
        </Row>


        {/* Gas Rewards Configuration */}
        <section style={{ marginTop: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <GiftOutlined style={{ marginRight: '8px', color: '#f1c40f' }} />
              Gas Rewards Configuration (In M³)
            </Title>
          </div>
          <Alert
            title="Rewards are in Meter Cubes (M³)"
            description="Gas reward equals a percentage of profit for each transaction. Only customers with meter IDs can earn gas rewards."
            type="warning"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#fffde7', border: '1px solid #fff59d' }}
          />
          <Card variant="borderless" style={{ borderRadius: '12px' }}>
             <Row gutter={48}>
                <Col span={12}>
                    <div style={{ marginBottom: '12px' }}><Text strong style={{ color: '#52c41a' }}>WITH Meter ID (Gas Reward Eligible)</Text></div>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Retailer Share</Text></Col>
                        <Col><Tag color="blue">60%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Company Share</Text></Col>
                        <Col><Tag color="orange">28%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Gas Reward (M³)</Text></Col>
                        <Col><Tag color="green">12%</Tag></Col>
                    </Row>
                </Col>
                <Col span={12} style={{ borderLeft: '1px solid #f0f0f0' }}>
                    <div style={{ marginBottom: '12px' }}><Text strong style={{ color: '#ff4d4f' }}>WITHOUT Meter ID (No Gas Reward)</Text></div>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Retailer Share</Text></Col>
                        <Col><Tag color="blue">60%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Company Share</Text></Col>
                        <Col><Tag color="red">40%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Gas Reward</Text></Col>
                        <Col><Text type="danger" style={{ fontSize: '12px' }}>0% (User not eligible)</Text></Col>
                    </Row>
                </Col>
             </Row>
          </Card>
        </section>

        {/* Gas Pricing Plans Section */}
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <ThunderboltOutlined style={{ marginRight: '8px', color: '#ff6b35' }} />
              Gas Purchase Pricing Plans
            </Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showPlanModal()}
              style={{ background: '#ff6b35', borderColor: '#ff6b35', borderRadius: '8px' }}
            >
              Add New Plan
            </Button>
          </div>
          <Alert
            title="Manage Predefined Gas Purchase Amounts"
            description="Add or edit the fixed amounts available for customers to choose from during gas recharge."
            type="info"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#fff2e8', border: '1px solid #ffbb96' }}
          />
          <Card variant="borderless" style={{ borderRadius: '12px' }}>
            <Table
              dataSource={plans}
              loading={plansLoading}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Amount (RWF)',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amt: number) => <Text strong>{amt.toLocaleString()} RWF</Text>
                },
                {
                  title: 'Equivalent Volume (m³)',
                  key: 'volume',
                  render: (_, record: any) => {
                    const price = config?.gasPricePerM3 || 850;
                    return <Text type="secondary">{(record.amount / price).toFixed(4)} m³</Text>
                  }
                },
                {
                  title: 'Status',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  render: (active: boolean, record: any) => (
                    <Switch 
                      checked={active} 
                      onChange={() => togglePlanStatus(record)} 
                      size="small" 
                    />
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record: any) => (
                    <Space>
                      <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => showPlanModal(record)}
                      />
                      <Popconfirm
                        title="Delete this plan?"
                        onConfirm={() => deletePlan(record.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />} 
                        />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </section>
      </Form>

      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Edit Margins & Loan Interest Rates</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        centered
        styles={{
          header: { borderBottom: 'none', padding: '24px 24px 0' },
          body: { padding: '24px' }
        }}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSave}
          requiredMark
        >
          <Form.Item
            name="retailerShare"
            label={<Text strong>Retailer Share (%)</Text>}
            rules={[{ required: true, message: 'Please input retailer share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter retailer share"
            />
          </Form.Item>

          <Form.Item
            name="companyShare"
            label={<Text strong>Company Share (%)</Text>}
            rules={[{ required: true, message: 'Please input company share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter company share"
            />
          </Form.Item>

          <Form.Item
            name="gasRewardShare"
            label={<Text strong>Gas Reward (% of profit in M³)</Text>}
            rules={[{ required: true, message: 'Please input gas reward share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter gas reward share"
            />
          </Form.Item>

          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <Text type="secondary" strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Loan Interest Rates (%)
            </Text>
            <Divider style={{ margin: '8px 0 0 0' }} />
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerLoanInterest"
                label={<Text strong style={{ fontSize: '12px' }}>Customer (%)</Text>}
                rules={[{ required: true, message: 'Input rate' }]}
              >
                <InputNumber style={{ width: '100%', borderRadius: '8px' }} suffix="%" placeholder="10" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="retailerLoanInterest"
                label={<Text strong style={{ fontSize: '12px' }}>Retailer (%)</Text>}
                rules={[{ required: true, message: 'Input rate' }]}
              >
                <InputNumber style={{ width: '100%', borderRadius: '8px' }} suffix="%" placeholder="5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="wholesalerLoanInterest"
                label={<Text strong style={{ fontSize: '12px' }}>Wholesaler (%)</Text>}
                rules={[{ required: true, message: 'Input rate' }]}
              >
                <InputNumber style={{ width: '100%', borderRadius: '8px' }} suffix="%" placeholder="8" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              onClick={() => setIsModalVisible(false)}
              style={{ borderRadius: '8px', height: '40px', padding: '0 24px' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              style={{ 
                borderRadius: '8px', 
                height: '40px', 
                padding: '0 24px',
                background: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Plan Add/Edit Modal */}
      <Modal
        title={editingPlan ? "Edit Gas Pricing Plan" : "Add New Gas Pricing Plan"}
        open={isPlanModalVisible}
        onCancel={() => setIsPlanModalVisible(false)}
        footer={null}
        centered
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handlePlanSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="amount"
            label="Plan Amount (RWF)"
            rules={[{ required: true, message: 'Please input the amount' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="e.g. 500" 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setIsPlanModalVisible(false)}>Cancel</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ background: '#ff6b35', borderColor: '#ff6b35' }}
            >
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .ant-input-number-input {
          text-align: right !important;
          padding-right: 0 !important;
        }
        .ant-input-number-handler-wrap {
          display: none;
        }
        .ant-form-item-label > label {
            color: #8c8c8c !important;
        }
      `}</style>
    </div>
  );
};

export default PricingConfigPage;
