import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Row,
  Col,
  Select,
  Alert,
  Tooltip,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DisconnectOutlined,
  FireOutlined,
  IdcardOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface GasMeter {
  id: number;
  meterNumber: string;
  meterType: string;
  aliasName: string;
  ownerName: string;
  ownerPhone: string;
  status: string;
  currentUnits: number;
  consumerId: number;
  totalUnits: number;
  totalPaid: number;
  consumerProfile?: {
    user?: {
      name: string;
      phone: string;
      email: string;
    };
    address?: string;
  };
}

const GasMeterManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [meters, setMeters] = useState<GasMeter[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<GasMeter | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState<any[]>([]);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchMeters();
    fetchCustomers();
  }, []);

  const fetchMeters = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getGasMeters();
      if (response.data.success) {
        setMeters(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching gas meters:', err);
      message.error('Failed to load gas meters');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await adminApi.getCustomers();
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleRegisterMeter = async (values: any) => {
    setLoading(true);
    try {
      const response = await adminApi.registerGasMeter(values);
      if (response.data.success) {
        message.success(response.data.message || 'Gas meter registered successfully');
        setCreateModalVisible(false);
        form.resetFields();
        fetchMeters();
      } else {
        message.error(response.data.error || 'Failed to register meter');
      }
    } catch (err: any) {
      console.error('Register meter error:', err);
      message.error(err.response?.data?.error || 'Failed to register gas meter');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkMeter = async (id: number) => {
    setLoading(true);
    try {
      const response = await adminApi.unlinkGasMeter(id);
      if (response.data.success) {
        message.success('Gas meter unlinked successfully');
        fetchMeters();
      } else {
        message.error(response.data.error || 'Failed to unlink meter');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to unlink gas meter');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (meter: GasMeter) => {
    setSelectedMeter(meter);
    setDetailsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'removed': return 'default';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(amount || 0);
  };

  const filteredMeters = meters.filter(meter => {
    const matchesSearch = 
      meter.meterNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      meter.ownerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      meter.consumerProfile?.user?.name?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || meter.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<GasMeter> = [
    {
      title: 'Meter Number',
      dataIndex: 'meterNumber',
      key: 'meterNumber',
      render: (text) => <Text strong><FireOutlined style={{ color: '#fa8c16', marginRight: 8 }} />{text}</Text>,
    },
    {
      title: 'Assigned Customer',
      key: 'customer',
      render: (_, record) => {
        const name = record.consumerProfile?.user?.name || record.ownerName;
        const phone = record.consumerProfile?.user?.phone || record.ownerPhone;
        if (!name && !phone) {
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>Consumer ID: {record.consumerId}</Text>
              <Tag color="orange" style={{ fontSize: 10 }}>Account Deleted</Tag>
            </Space>
          );
        }
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{name || 'Unknown'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{phone || ''}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Metrics',
      key: 'metrics',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>Units: {record.totalUnits?.toFixed(2)} m³</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Paid: {formatCurrency(record.totalPaid)}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'meterType',
      key: 'meterType',
      render: (type) => (
        <Tag color={type === 'TOKEN' ? 'gold' : 'cyan'}>
          {type === 'TOKEN' ? '⚡ Token' : '🔧 Piping'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status !== 'removed' && (
            <Popconfirm
              title="Unlink Meter"
              description="Are you sure you want to unlink this meter from the customer? It will remain in the system for reassignment."
              onConfirm={() => handleUnlinkMeter(record.id)}
              okText="Yes, Unlink"
              cancelText="Cancel"
            >
              <Tooltip title="Unlink Meter">
                <Button type="text" danger icon={<DisconnectOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <FireOutlined style={{ color: '#fa8c16', marginRight: 12 }} />
            Gas Meters Management
          </Title>
          <Text type="secondary">Manage gas meters, assignments, and view consumption metrics</Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setCreateModalVisible(true)}
            size="large"
          >
            Add & Assign Meter
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="Search by meter number, customer name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Statuses</Option>
              <Option value="active">Active</Option>
              <Option value="removed">Removed / Unassigned</Option>
            </Select>
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={fetchMeters}>
              Refresh
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredMeters}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add & Assign Meter Modal */}
      <Modal
        title={<span><PlusOutlined /> Register & Assign Gas Meter</span>}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Alert
          message="Reassignment"
          description="If you enter a meter number that is currently 'removed', it will be automatically reassigned to the selected customer."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegisterMeter}
        >
          <Form.Item
            name="meter_number"
            label="Meter Number / IMEI"
            rules={[{ required: true, message: 'Please enter meter number' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Enter meter number" />
          </Form.Item>

          <Form.Item
            name="consumerId"
            label="Assign to Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              showSearch
              placeholder="Select a customer"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.user?.name || 'Unnamed'} ({c.user?.phone || 'No phone'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="alias_name"
            label="Meter Alias (Optional)"
          >
            <Input placeholder="e.g. Home Kitchen" />
          </Form.Item>

          <Form.Item
            name="owner_name"
            label="Holder Name (Optional)"
          >
            <Input prefix={<UserOutlined />} placeholder="Enter holder name" />
          </Form.Item>

          <Form.Item
            name="owner_phone"
            label="Holder Phone (Optional)"
          >
            <Input prefix={<PhoneOutlined />} placeholder="Enter holder phone" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Register & Assign
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={<span><EyeOutlined /> Meter Details</span>}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedMeter && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Meter Number">
              <Text strong>{selectedMeter.meterNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Meter Type">
              <Tag color={selectedMeter.meterType === 'TOKEN' ? 'gold' : 'cyan'}>
                {selectedMeter.meterType === 'TOKEN' ? '⚡ Token' : '🔧 Piping'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Alias">
              {selectedMeter.aliasName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedMeter.status)}>
                {selectedMeter.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Holder Name">
              {selectedMeter.ownerName || selectedMeter.consumerProfile?.user?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Holder Phone">
              {selectedMeter.ownerPhone || selectedMeter.consumerProfile?.user?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Physical Address">
              {selectedMeter.consumerProfile?.address || 'Address not provided by customer'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Units Purchased">
              <Text strong style={{ color: '#52c41a' }}>{selectedMeter.totalUnits?.toFixed(2)} m³</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount Paid">
              <Text strong>{formatCurrency(selectedMeter.totalPaid)}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

    </div>
  );
};

export default GasMeterManagementPage;
