import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, message,
  Typography, Select, Alert, Tooltip, Popconfirm, Descriptions,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  DisconnectOutlined, FireOutlined, IdcardOutlined, UserOutlined,
  PhoneOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Text } = Typography;
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
    fullName?: string;
    user?: { name: string; phone: string; email: string };
    address?: string;
  };
}

interface CustomerGroup {
  key: string;
  customerName: string;
  customerPhone: string;
  meters: GasMeter[];
}

const GasMeterManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [meters, setMeters] = useState<GasMeter[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<GasMeter | null>(null);
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => { fetchMeters(); fetchCustomers(); }, []);

  const fetchMeters = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getGasMeters();
      if (response.data.success) setMeters(response.data.data || []);
    } catch (err: any) {
      message.error('Failed to load gas meters');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await adminApi.getCustomers();
      if (response.data.success) setCustomers(response.data.customers || []);
    } catch (err) { console.error('Error fetching customers:', err); }
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
      message.error(err.response?.data?.error || 'Failed to register gas meter');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkMeter = async (id: number) => {
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
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(amount || 0);

  const filteredMeters = meters.filter(meter => {
    const name = meter.consumerProfile?.user?.name || meter.ownerName || '';
    const phone = meter.consumerProfile?.user?.phone || meter.ownerPhone || '';
    return (
      meter.meterNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      name.toLowerCase().includes(searchText.toLowerCase()) ||
      phone.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const groupedMeters = useMemo<CustomerGroup[]>(() => {
    const groups: Record<string, CustomerGroup> = {};
    filteredMeters.forEach(meter => {
      const key = String(meter.consumerId || 'unassigned');
      const name = meter.consumerProfile?.user?.name || meter.consumerProfile?.fullName || meter.ownerName || 'Unknown Customer';
      const phone = meter.consumerProfile?.user?.phone || meter.ownerPhone || '';
      if (!groups[key]) groups[key] = { key, customerName: name, customerPhone: phone, meters: [] };
      groups[key].meters.push(meter);
    });
    return Object.values(groups);
  }, [filteredMeters]);

  const meterColumns: ColumnsType<GasMeter> = [
    {
      title: 'Meter Number', dataIndex: 'meterNumber', key: 'meterNumber',
      render: (text) => <Text strong><FireOutlined style={{ color: '#fa8c16', marginRight: 6 }} />{text}</Text>,
    },
    {
      title: 'Type', dataIndex: 'meterType', key: 'meterType',
      render: (type) => <Tag color={type === 'TOKEN' ? 'gold' : 'cyan'}>{type === 'TOKEN' ? 'Token' : 'Piping'}</Tag>,
    },
    {
      title: 'Alias', dataIndex: 'aliasName', key: 'aliasName',
      render: (text) => <Text type="secondary">{text || '-'}</Text>,
    },
    {
      title: 'Metrics', key: 'metrics',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>Units: {record.totalUnits?.toFixed(2)} m3</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Paid: {formatCurrency(record.totalPaid)}</Text>
        </Space>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => <Tag color={status === 'active' ? 'success' : 'default'}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => { setSelectedMeter(record); setDetailsModalVisible(true); }} />
          </Tooltip>
          {record.status !== 'removed' && (
            <Popconfirm
              title="Unlink Meter"
              description="Unlink this meter from the customer? You can reassign it later using Add & Assign Meter."
              onConfirm={() => handleUnlinkMeter(record.id)}
              okText="Yes, Unlink" cancelText="Cancel"
            >
              <Tooltip title="Unlink Meter">
                <Button type="text" size="small" danger icon={<DisconnectOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const groupColumns: ColumnsType<CustomerGroup> = [
    {
      title: 'Assigned Customer', key: 'customer',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          {record.customerPhone && <Text type="secondary" style={{ fontSize: 12 }}>{record.customerPhone}</Text>}
        </Space>
      ),
    },
    {
      title: 'Total Meters', key: 'total_meters',
      render: (_, record) => <Text>{record.meters.length} meter{record.meters.length !== 1 ? 's' : ''}</Text>,
    },
    {
      title: 'Total Units', key: 'total_units',
      render: (_, record) => {
        const total = record.meters.reduce((sum, m) => sum + (m.totalUnits || 0), 0);
        return <Text strong>{total.toFixed(2)} m3</Text>;
      },
    },
    {
      title: 'Total Paid', key: 'total_paid',
      render: (_, record) => {
        const total = record.meters.reduce((sum, m) => sum + (m.totalPaid || 0), 0);
        return <Text strong style={{ color: '#52c41a' }}>{formatCurrency(total)}</Text>;
      },
    },
  ];

  const expandedRowRender = (record: CustomerGroup) => (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <Table
        columns={meterColumns} dataSource={record.meters}
        pagination={false} rowKey="id" size="small"
        className="bg-gray-50/50" scroll={{ x: 700 }}
      />
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-2 sm:p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">

        <div className="bg-[#fa8c16] p-4 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8 text-white flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg text-xl sm:text-2xl"><FireOutlined /></div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold m-0 text-white">Gas Meters Management</h1>
              <p className="text-white/80 m-0 text-xs sm:text-sm">Manage gas meters, assignments, and view consumption metrics</p>
            </div>
          </div>
          <Space size="small" wrap>
            <Button icon={<ReloadOutlined />} onClick={fetchMeters}
              className="bg-white border-none text-gray-700 h-9 px-4 rounded-lg flex items-center font-medium">
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}
              className="h-9 px-4 rounded-lg flex items-center font-medium"
              style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)' }}>
              Add &amp; Assign Meter
            </Button>
          </Space>
        </div>

        <Card bordered={false} className="mb-6 shadow-sm rounded-xl p-1">
          <Input
            placeholder="Search by meter number, customer name or phone..."
            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
            size="large" value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="border-none bg-gray-50/50 rounded-lg" allowClear
          />
        </Card>

        <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden p-0 mb-8 min-h-[500px]">
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table
              columns={groupColumns} dataSource={groupedMeters}
              expandable={{ expandedRowRender }}
              rowKey="key" loading={loading} scroll={{ x: 600 }}
              pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} customers`, className: 'px-4 sm:px-6 py-4 border-t' }}
              locale={{
                emptyText: (
                  <div className="py-24 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                      <FileTextOutlined className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-gray-400 text-sm">No active meters found</p>
                  </div>
                ),
              }}
            />
          </div>
        </Card>
      </div>

      <Modal
        title={<span className="text-lg font-bold">Register &amp; Assign Gas Meter</span>}
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        footer={null} centered
      >
        <Alert message="Reassignment"
          description="If you enter a meter number that was previously unlinked, it will be automatically reassigned to the selected customer."
          type="info" showIcon style={{ marginBottom: 16 }} />
        <Form form={form} layout="vertical" onFinish={handleRegisterMeter} className="mt-4">
          <Form.Item name="meter_number" label="Meter Number / IMEI"
            rules={[{ required: true, message: 'Please enter meter number' }]}>
            <Input size="large" prefix={<IdcardOutlined />} placeholder="Enter meter number" />
          </Form.Item>
          <Form.Item name="consumerId" label="Assign to Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}>
            <Select showSearch size="large" placeholder="Select a customer" optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }>
              {customers.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.user?.name || 'Unnamed'} ({c.user?.phone || 'No phone'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="alias_name" label="Meter Alias (Optional)">
            <Input size="large" placeholder="e.g. Home Kitchen" />
          </Form.Item>
          <Form.Item name="owner_name" label="Holder Name (Optional)">
            <Input size="large" prefix={<UserOutlined />} placeholder="Enter holder name" />
          </Form.Item>
          <Form.Item name="owner_phone" label="Holder Phone (Optional)">
            <Input size="large" prefix={<PhoneOutlined />} placeholder="Enter holder phone" />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Button onClick={() => { setCreateModalVisible(false); form.resetFields(); }} className="mr-2">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>Register &amp; Assign</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-lg font-bold">Meter Details</span>}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailsModalVisible(false)}>Close</Button>]}
        width={600} centered
      >
        {selectedMeter && (
          <Descriptions bordered column={1} className="mt-4">
            <Descriptions.Item label="Meter Number"><Text strong>{selectedMeter.meterNumber}</Text></Descriptions.Item>
            <Descriptions.Item label="Assigned Customer">
              <Text strong>{selectedMeter.consumerProfile?.user?.name || selectedMeter.consumerProfile?.fullName || selectedMeter.ownerName || 'N/A'}</Text>
              {(selectedMeter.consumerProfile?.user?.phone || selectedMeter.ownerPhone) && (
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  {selectedMeter.consumerProfile?.user?.phone || selectedMeter.ownerPhone}
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Meter Type">
              <Tag color={selectedMeter.meterType === 'TOKEN' ? 'gold' : 'cyan'}>
                {selectedMeter.meterType === 'TOKEN' ? 'Token' : 'Piping'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Alias">{selectedMeter.aliasName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedMeter.status === 'active' ? 'success' : 'default'}>{selectedMeter.status?.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Holder Name">
              {selectedMeter.ownerName || selectedMeter.consumerProfile?.user?.name || selectedMeter.consumerProfile?.fullName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Holder Phone">
              {selectedMeter.ownerPhone || selectedMeter.consumerProfile?.user?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Physical Address">
              {selectedMeter.consumerProfile?.address || 'Address not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Units Purchased">
              <Text strong style={{ color: '#52c41a' }}>{selectedMeter.totalUnits?.toFixed(2)} m3</Text>
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
