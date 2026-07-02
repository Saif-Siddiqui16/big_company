import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Button, Space, message, Modal, Input } from 'antd';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;

export default function ProfitInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [orderIdInput, setOrderIdInput] = useState('');

    useEffect(() => {
        fetchInvoices();
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

    const handleGenerateInvoice = async () => {
        if (!orderIdInput) {
            message.warning("Please enter an Order ID");
            return;
        }
        
        try {
            await adminApi.generateProfitInvoice(Number(orderIdInput));
            message.success('Profit Invoice generated successfully');
            setGenerateModalVisible(false);
            setOrderIdInput('');
            fetchInvoices();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to generate profit invoice');
        }
    };

    const columns = [
        {
            title: 'Invoice No',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (val: string) => <Text strong>{val}</Text>
        },
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId'
        },
        {
            title: 'Wholesaler',
            key: 'wholesaler',
            render: (_: any, record: any) => (
                <Text>{record.order?.wholesalerProfile?.companyName || 'Unknown'}</Text>
            )
        },
        {
            title: 'Retailer',
            key: 'retailer',
            render: (_: any, record: any) => (
                <Text>{record.order?.retailerProfile?.shopName || 'Unknown'}</Text>
            )
        },
        {
            title: 'Order Total',
            key: 'orderTotal',
            render: (_: any, record: any) => (
                <Text>{(record.order?.totalAmount || 0).toLocaleString()} RWF</Text>
            )
        },
        {
            title: 'Profit Amount',
            dataIndex: 'profitAmount',
            key: 'profitAmount',
            render: (val: number) => <Text strong style={{ color: '#10b981' }}>{val.toLocaleString()} RWF</Text>
        },
        {
            title: 'Generated On',
            dataIndex: 'generatedAt',
            key: 'generatedAt',
            render: (val: string) => new Date(val).toLocaleDateString()
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Profit Invoices</Title>
                    <Text type="secondary">Manage and generate profit invoices from orders.</Text>
                </div>
                <Space>
                    <Button onClick={fetchInvoices} loading={loading}>Refresh</Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setGenerateModalVisible(true)}
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
                title="Generate Profit Invoice"
                open={generateModalVisible}
                onOk={handleGenerateInvoice}
                onCancel={() => {
                    setGenerateModalVisible(false);
                    setOrderIdInput('');
                }}
                okText="Generate"
            >
                <p>Enter the Order ID to calculate and generate a Profit Invoice for that specific transaction.</p>
                <div style={{ marginTop: '16px' }}>
                    <Text strong>Order ID:</Text>
                    <Input 
                        type="number"
                        value={orderIdInput} 
                        onChange={(e) => setOrderIdInput(e.target.value)} 
                        placeholder="e.g. 104"
                        style={{ marginTop: '8px' }}
                    />
                </div>
            </Modal>
        </div>
    );
}
