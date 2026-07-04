import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Descriptions, Modal, Button } from 'antd';
import { FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

export default function RetailerProfitInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await retailerApi.getProfitInvoices();
            if (res.data?.success) setInvoices(res.data.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Invoice #',
            dataIndex: 'id',
            key: 'id',
            render: (v: number) => <Text strong>#{v}</Text>
        },
        {
            title: 'Total Revenue',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            render: (v: number) => `${v?.toLocaleString()} RWF`
        },
        {
            title: 'Net Profit (B)',
            dataIndex: 'netProfit',
            key: 'netProfit',
            render: (v: number) => `${v?.toLocaleString()} RWF`
        },
        {
            title: 'Total Expenses',
            dataIndex: 'totalExpense',
            key: 'totalExpense',
            render: (v: number) => <Text style={{ color: '#ef4444' }}>{v?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Your Share',
            dataIndex: 'recipientShareAmt',
            key: 'recipientShareAmt',
            render: (v: number) => <Text strong style={{ color: '#10b981' }}>{v?.toLocaleString()} RWF</Text>
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => new Date(v).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(record)}>View</Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    <FileTextOutlined style={{ marginRight: 8, color: '#6366f1' }} />
                    Profit Invoices
                </Title>
                <Text type="secondary">Invoices issued by the admin for your settled profit terms.</Text>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={invoices}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No profit invoices issued yet.' }}
                />
            </Card>

            <Modal
                title={`Invoice #${selected?.id} — Details`}
                open={!!selected}
                onCancel={() => setSelected(null)}
                footer={<Button onClick={() => setSelected(null)}>Close</Button>}
                width={600}
            >
                {selected && (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Total Revenue" span={2}>{selected.totalRevenue?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Gross Profit">{selected.grossProfit?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Tax">{selected.tax?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Rewards Given">{selected.rewardsGivenAmt?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Rent Expense">{selected.rentExpense?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Salaries">{selected.salariesExpense?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Other Expenses">{selected.otherExpense?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Total Expenses" span={2}>
                            <Text style={{ color: '#ef4444' }}>{selected.totalExpense?.toLocaleString()} RWF</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Net Profit (B)" span={2}>
                            <Text strong>{selected.netProfit?.toLocaleString()} RWF</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={`Your Share (${selected.recipientSharePct}%)`}>
                            <Text strong style={{ color: '#10b981' }}>{selected.recipientShareAmt?.toLocaleString()} RWF</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={`Company Share (${selected.companySharePct}%)`}>{selected.companyShareAmt?.toLocaleString()} RWF</Descriptions.Item>
                        <Descriptions.Item label="Final Payable" span={2}>
                            <Text strong style={{ color: '#10b981', fontSize: 18 }}>{selected.finalPayable?.toLocaleString()} RWF</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Date" span={2}>{new Date(selected.createdAt).toLocaleString()}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}
