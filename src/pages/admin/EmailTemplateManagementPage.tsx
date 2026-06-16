import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, message, Modal, Form, Input, Space, Tag, Switch, Popconfirm, Tabs, Select } from 'antd';
import { MailOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  description?: string;
  isActive: boolean;
  portal?: string;
  triggerName?: string;
  updatedAt: string;
}

interface EmailEvent {
  id: number;
  eventSlug: string;
  templateName: string;
  description?: string;
  updatedAt: string;
}

const EmailTemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingEvent, setEditingEvent] = useState<EmailEvent | null>(null);
  const [form] = Form.useForm();
  const [eventForm] = Form.useForm();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEmailTemplates();
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error: any) {
      message.error('Failed to fetch templates: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await adminApi.getEmailEvents();
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error: any) {
      message.error('Failed to fetch events: ' + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchEvents();
  }, []);

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: EmailTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await adminApi.deleteEmailTemplate(id);
      if (response.data.success) {
        message.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error: any) {
      message.error('Failed to delete template: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditEvent = (record: EmailEvent) => {
    setEditingEvent(record);
    eventForm.setFieldsValue(record);
    setIsEventModalVisible(true);
  };

  const handleEventModalOk = async () => {
    try {
      if (!editingEvent) return;
      const values = await eventForm.validateFields();
      const response = await adminApi.updateEmailEvent(editingEvent.id, values);
      if (response.data.success) {
        message.success('Event mapping updated');
        setIsEventModalVisible(false);
        fetchEvents();
      }
    } catch (error: any) {
      if (error.name !== 'ValidationError') {
        message.error('Failed to update mapping: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await adminApi.saveEmailTemplate(values);
      if (response.data.success) {
        message.success(editingTemplate ? 'Template updated' : 'Template created');
        setIsModalVisible(false);
        fetchTemplates();
      }
    } catch (error: any) {
      if (error.name !== 'ValidationError') {
        message.error('Failed to save template: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Audience/Target',
      dataIndex: 'portal',
      key: 'portal',
      render: (text: string) => <Tag color="orange">{(text || 'CUSTOMER').toUpperCase()}</Tag>
    },
    {
      title: 'Trigger Action',
      dataIndex: 'triggerName',
      key: 'triggerName',
      render: (text: string) => <Text>{text || '-'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EmailTemplate) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const eventColumns = [
    {
      title: 'System Event',
      dataIndex: 'eventSlug',
      key: 'eventSlug',
      render: (text: string) => <Tag color="purple">{text}</Tag>
    },
    {
      title: 'Mapped Template',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EmailEvent) => (
        <Button icon={<SettingOutlined />} onClick={() => handleEditEvent(record)}>Change Mapping</Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}><MailOutlined /> Email System Management</Title>
          <Text type="secondary">Manage email templates and link them to system events.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Create New Template
        </Button>
      </div>

      <Tabs defaultActiveKey="1" type="card">
        <Tabs.TabPane tab="Email Templates" key="1">
          <Card>
            <div style={{ marginBottom: 16, padding: '12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
              <Space align="start">
                <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                <div>
                  <Text strong>Dynamic Placeholders:</Text>
                  <Paragraph style={{ marginBottom: 0 }}>
                    Use <Text code>{`{{variable_name}}`}</Text> syntax in Subject or Content. 
                    Common variables: <Text code>name</Text>, <Text code>email</Text>, <Text code>otp_code</Text>, <Text code>amount</Text>, <Text code>date</Text>.
                  </Paragraph>
                </div>
              </Space>
            </div>

            <Table
              dataSource={templates}
              columns={columns}
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="System Event Mappings" key="2">
          <Card>
            <div style={{ marginBottom: 16, padding: '12px', background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 4 }}>
              <Space align="start">
                <SettingOutlined style={{ color: '#722ed1', marginTop: 4 }} />
                <div>
                  <Text strong>What are Event Mappings?</Text>
                  <Paragraph style={{ marginBottom: 0 }}>
                    These settings control which template is used when a specific system event happens (e.g., when a Retailer is created). 
                    Change the mapping here to switch templates globally without touching any code.
                  </Paragraph>
                </div>
              </Space>
            </div>

            <Table
              dataSource={events}
              columns={eventColumns}
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      {/* Template Edit Modal */}
      <Modal
        title={editingTemplate ? "Edit Email Template" : "Create New Template"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="Save Template"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Template Name (Internal Identifier)"
            rules={[{ required: true, message: 'Please enter a template name' }]}
          >
            <Input placeholder="e.g., ONBOARDING_WELCOME" disabled={!!editingTemplate} />
          </Form.Item>

          <Form.Item
            name="portal"
            label="Template Target / Audience"
            rules={[{ required: true, message: 'Please select template target audience' }]}
            initialValue="CUSTOMER"
          >
            <Select placeholder="Select target audience">
              <Option value="CUSTOMER">Customer</Option>
              <Option value="RETAILER">Retailer</Option>
              <Option value="WHOLESALER">Wholesaler</Option>
              <Option value="SHARED">Multiple/All (Shared)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="triggerName"
            label="Trigger Action"
            rules={[{ required: true, message: 'Please select or enter the trigger action' }]}
          >
            <Select placeholder="Select or enter trigger action" showSearch allowClear style={{ width: '100%' }}>
              <Option value="account creation">Account Creation</Option>
              <Option value="password reset">Password Reset</Option>
              <Option value="order confirmation">Order Confirmation</Option>
              <Option value="gas top-up">Gas Top-up</Option>
              <Option value="loan request">Loan Request</Option>
              <Option value="loan repayment">Loan Repayment</Option>
              <Option value="account activation">Account Activation</Option>
              <Option value="account deactivation">Account Deactivation</Option>
              <Option value="PIN/password change">PIN/Password Change</Option>
              <Option value="reward notification">Reward Notification</Option>
              <Option value="system announcement">System Announcement</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Email Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="e.g., Welcome to BIG Ltd, {{name}}!" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input placeholder="What is this template used for?" />
          </Form.Item>

          <Form.Item
            name="content"
            label="HTML Content"
            rules={[{ required: true, message: 'Please enter the email content' }]}
          >
            <TextArea 
              rows={12} 
              placeholder="<h1>Hello {{name}}</h1><p>Your account is ready.</p>" 
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Event Mapping Edit Modal */}
      <Modal
        title="Update Event Mapping"
        open={isEventModalVisible}
        onOk={handleEventModalOk}
        onCancel={() => setIsEventModalVisible(false)}
        okText="Update Mapping"
      >
        <Form
          form={eventForm}
          layout="vertical"
        >
          <Form.Item label="System Event Slug">
            <Input value={editingEvent?.eventSlug} disabled />
          </Form.Item>

          <Form.Item
            name="templateName"
            label="Mapped Template"
            rules={[{ required: true, message: 'Please select a template' }]}
          >
            <Select placeholder="Select template to use for this event">
              {templates.map(t => (
                <Option key={t.id} value={t.name}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailTemplateManagementPage;
