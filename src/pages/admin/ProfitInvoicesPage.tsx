import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Button, Space, message, Modal, Input, Select, Form, Row, Col, Divider } from 'antd';
import { PlusOutlined, CalculatorOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ProfitInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [form] = Form.useForm();
    const recipientType = Form.useWatch('recipientType', form);

    useEffect(() => {
        fetchInvoices();
        fetchRecipients();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getProfitInvoices();
            if (response.data?.success) {
                setInvoices(response.data.data);
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to fetch profit invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await adminApi.getProfitInvoiceRecipients();
            if (response.data?.success) {
                setRecipients(response.data.data);
            }
        } catch (error: any) {
            message.error('Failed to fetch recipients');
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            const values = await form.validateFields();
            
            const selectedRecipient = recipients.find(r => r.id === values.recipientId && r.type === values.recipientType);
            if (!selectedRecipient) {
                return message.error("Invalid recipient selected.");
            }
            
            const payload = {
                ...values,
                recipientName: selectedRecipient.name
            };

            await adminApi.generateProfitInvoice(payload);
            message.success('Profit Invoice generated successfully');
            setGenerateModalVisible(false);
            form.resetFields();
            fetchInvoices();
        } catch (error: any) {
            if (error.errorFields) return; // Validation error
            message.error(error.response?.data?.error || 'Failed to generate profit invoice');
        }
    };

    const handleRecipientChange = async (recipientId: number) => {
        const type = form.getFieldValue('recipientType');
        if (!type || !recipientId) return;

        try {
            const response = await adminApi.getProfitInvoiceStats(type, recipientId);
            if (response.data?.success) {
                const stats = response.data.data;
                
                const totalOrders = stats.totalOrders || 0;
                const totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
                const grossProfit = Math.round(stats.grossProfit * 100) / 100;
                const rewardsGivenAmt = Math.round(stats.gasRewardsGiven * 100) / 100;
                const tax = stats.tax || 0; // Fetch calculated tax from backend

                form.setFieldsValue({
                    totalOrders,
                    totalRevenue,
                    grossProfit,
                    rewardsGivenAmt,
                    tax
                });
                
                // Manually trigger calculation since setFieldsValue doesn't fire onValuesChange
                const allValues = { ...form.getFieldsValue(), totalOrders, totalRevenue, grossProfit, rewardsGivenAmt, tax };
                onValuesChange({ grossProfit, rewardsGivenAmt, tax }, allValues);
            }
        } catch (error: any) {
            message.error('Failed to fetch stats for recipient');
        }
    };

    // Auto calculate fields when values change
    const onValuesChange = (changedValues: any, allValues: any) => {
        const round = (n: number) => Math.round(n * 100) / 100;

        // Net Profit A = Gross Profit - Tax
        const gp = Number(allValues.grossProfit || 0);
        const tax = Number(allValues.tax || 0);
        let npA = round(gp - tax);

        // Total Expenses = Rewards + Rent + Salaries + Other
        const rent = Number(allValues.rentExpense || 0);
        const sal = Number(allValues.salariesExpense || 0);
        const other = Number(allValues.otherExpense || 0);
        const rewards = Number(allValues.rewardsGivenAmt || 0);
        let tExp = round(rent + sal + other + rewards);

        if (changedValues.rentExpense !== undefined || changedValues.salariesExpense !== undefined || changedValues.otherExpense !== undefined || changedValues.rewardsGivenAmt !== undefined) {
            form.setFieldsValue({ totalExpense: tExp });
        } else {
            tExp = Number(allValues.totalExpense || tExp);
        }

        // Net Profit B = Net Profit A - Total Expenses
        let npB = round(npA - tExp);
        if (changedValues.grossProfit !== undefined || changedValues.tax !== undefined || changedValues.totalExpense !== undefined || changedValues.rentExpense !== undefined || changedValues.salariesExpense !== undefined || changedValues.otherExpense !== undefined || changedValues.rewardsGivenAmt !== undefined) {
            form.setFieldsValue({ netProfit: npB });
        } else {
            npB = Number(allValues.netProfit || npB);
        }

        // Splits — always recalculate whenever any relevant field changes
        const rPct = Number(allValues.recipientSharePct || 0);
        const cPct = Number(allValues.companySharePct || 0);
        const rAmt = round(npB * (rPct / 100));
        const cAmt = round(npB * (cPct / 100));

        form.setFieldsValue({ recipientShareAmt: rAmt, companyShareAmt: cAmt, finalPayable: rAmt });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (val: number) => <Text strong>#{val}</Text>
        },
        {
            title: 'Recipient',
            key: 'recipient',
            render: (_: any, record: any) => (
                <Text strong>{record.recipientName} <span style={{color:'#8c8c8c', fontSize:'12px'}}>({record.recipientType})</span></Text>
            )
        },
        {
            title: 'Total Orders',
            dataIndex: 'totalOrders',
            key: 'totalOrders',
            render: (val: number) => <Text>{val || 0}</Text>
        },
        {
            title: 'Total Revenue',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            render: (val: number) => <Text>{val?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Net Profit (B)',
            dataIndex: 'netProfit',
            key: 'netProfit',
            render: (val: number) => <Text>{val?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Total Expenses',
            dataIndex: 'totalExpense',
            key: 'totalExpense',
            render: (val: number) => <Text style={{ color: '#ef4444' }}>{val?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Final Payable',
            dataIndex: 'finalPayable',
            key: 'finalPayable',
            render: (val: number) => <Text strong style={{ color: '#10b981' }}>{val?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleDateString()
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Profit Invoices</Title>
                    <Text type="secondary">Manage and generate custom profit invoices.</Text>
                </div>
                <Space>
                    <Button onClick={fetchInvoices} loading={loading}>Refresh</Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => { form.resetFields(); setGenerateModalVisible(true); }}
                    >
                        Generate Invoice
                    </Button>
                </Space>
            </div>

            <Card className="shadow-sm rounded-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={invoices}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={<div><CalculatorOutlined /> Generate Profit Invoice</div>}
                open={generateModalVisible}
                onOk={handleGenerateInvoice}
                onCancel={() => setGenerateModalVisible(false)}
                okText="Generate & Save Invoice"
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={onValuesChange}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="recipientType" label="Recipient Type" rules={[{ required: true }]}>
                                <Select placeholder="Select Type" onChange={() => form.setFieldsValue({ recipientId: undefined })}>
                                    <Option value="Retailer">Retailer</Option>
                                    <Option value="Wholesaler">Wholesaler</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="recipientId" label="Recipient Name" rules={[{ required: true }]}>
                                <Select placeholder="Select Recipient" onChange={handleRecipientChange} disabled={!recipientType}>
                                    {recipients.filter(r => r.type === recipientType).map(r => (
                                        <Option key={r.id} value={r.id}>{r.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider titlePlacement="left">Orders, Revenue & Profit</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="totalOrders" label="Total Orders" rules={[{ required: true }]}>
                                <Input type="number" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="totalRevenue" label="Total Revenue (RWF)" rules={[{ required: true }]}>
                                <Input type="number" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="grossProfit" label="Gross Profit (RWF)">
                                <Input type="number" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="tax" label="Tax (RWF)">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="netProfit" label="Net Profit (B) (RWF)">
                                <Input type="number" readOnly style={{ fontWeight: 'bold', background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider titlePlacement="left">Expenses</Divider>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="rewardsGivenAmt" label="Rewards Given">
                                <Input type="number" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="rentExpense" label="Rent Expense">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="salariesExpense" label="Salaries">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="otherExpense" label="Other Expenses">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="totalExpense" label="Total Expenses">
                                <Input type="number" readOnly style={{ color: '#ef4444', background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider titlePlacement="left">Splits (%)</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="recipientSharePct" label="Recipient Share %">
                                <Input type="number" placeholder="80" />
                            </Form.Item>
                            <Form.Item name="recipientShareAmt">
                                <Input type="number" placeholder="Amount" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="companySharePct" label="Company Share %">
                                <Input type="number" placeholder="20" />
                            </Form.Item>
                            <Form.Item name="companyShareAmt">
                                <Input type="number" placeholder="Amount" readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />
                    <Row justify="end">
                        <Col span={12}>
                            <div style={{ textAlign: 'right', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>FINAL PAYABLE (RWF)</Text>
                                <Form.Item name="finalPayable" noStyle>
                                    <Input type="number" readOnly style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', textAlign: 'right', border: 'none', background: 'transparent' }} />
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
