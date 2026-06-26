import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, message, Upload, Button, Checkbox, Divider } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';

interface AddInventoryModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const { TextArea } = Input;

const defaultCategories = [
    'Grains & Cereals',
    'Cooking Essentials',
    'Beverages',
    'Snacks',
    'Dairy & Eggs',
    'Meat & Fish',
    'Fruits & Vegetables',
    'Household Items',
    'Personal Care',
    'Baby Products',
];

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
    open,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(defaultCategories);
    const [fileList, setFileList] = useState<any[]>([]);
    const [generatingBarcode, setGeneratingBarcode] = useState(false);

    const handleGenerateBarcode = async () => {
        setGeneratingBarcode(true);
        try {
            const response = await wholesalerApi.generateBarcode();
            if (response.data?.barcode) {
                form.setFieldsValue({ barcode: response.data.barcode });
                message.success('Barcode generated successfully!');
            } else {
                throw new Error('Failed to generate barcode');
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to generate barcode');
        } finally {
            setGeneratingBarcode(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        try {
            const response = await wholesalerApi.getCategories();
            if (response.data?.categories?.length > 0) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!values.supplierCost && !values.costPerPurchaseUnit) {
                message.error('Please enter either Supplier Cost Price or Cost per Purchase Unit');
                return;
            }
            setLoading(true);

            // Add image to values if available
            if (fileList.length > 0 && fileList[0].originFileObj) {
                const base64 = await getBase64(fileList[0].originFileObj);
                values.image = base64;
            }

            await wholesalerApi.createProduct(values);

            message.success('Inventory added successfully');
            form.resetFields();
            setFileList([]);
            onSuccess();
        } catch (error: any) {
            if (error.errorFields) return;
            message.error(error.response?.data?.error || 'Failed to add inventory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Add New Inventory Item"
            open={open}
            onCancel={() => {
                form.resetFields();
                setFileList([]);
                onCancel();
            }}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Add Item"
            width={700}
            centered
            style={{ borderRadius: '12px', overflow: 'hidden' }}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ stock: 0, low_stock_threshold: 10, unit: 'units' }}
                style={{ marginTop: '16px' }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label="Product Name"
                            rules={[{ required: true, message: 'Please enter product name' }]}
                        >
                            <Input placeholder="e.g. Premium Basmati Rice" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="sku"
                            label="SKU / Item Code"
                            rules={[{ required: true, message: 'Please enter SKU' }]}
                        >
                            <Input placeholder="e.g. BR-001" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="category"
                            label="Category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select placeholder="Select category" showSearch>
                                {categories.map(cat => (
                                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="unit"
                            label="Unit of Measure"
                            rules={[{ required: true, message: 'Please select unit' }]}
                        >
                            <Select placeholder="Select unit">
                                <Select.Option value="units">Units / Pieces</Select.Option>
                                <Select.Option value="kg">Kilograms (kg)</Select.Option>
                                <Select.Option value="liters">Liters (L)</Select.Option>
                                <Select.Option value="packs">Packs</Select.Option>
                                <Select.Option value="boxes">Boxes</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="supplierCost"
                            label="Supplier Cost Price (RWF)"
                            tooltip="The price paid per base unit (optional if Cost per Purchase Unit is provided)"
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="taxType"
                            label="Tax Type"
                            rules={[{ required: true, message: 'Please select tax type' }]}
                            tooltip="Select the legal tax category for this product"
                        >
                            <Select placeholder="Select tax type">
                                <Select.Option value="A">Type A (Exempted)</Select.Option>
                                <Select.Option value="B">Type B (Standard VAT 18%)</Select.Option>
                                <Select.Option value="C">Type C (Zero-Rated 0%)</Select.Option>
                                <Select.Option value="D">Type D (Excise Duty)</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" style={{ margin: '12px 0', fontSize: '14px', color: '#1890ff' }}>Multi-Unit of Measure (Multi-UOM)</Divider>
                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item
                            name="purchaseUnit"
                            label="Purchase Unit"
                            tooltip="e.g. Sack, Carton"
                        >
                            <Input placeholder="e.g. Sack" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            name="baseUnit"
                            label="Base Unit"
                            tooltip="e.g. Kilogram, Piece"
                        >
                            <Input placeholder="e.g. kg" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            name="conversionFactor"
                            label="Conversion Factor"
                            tooltip="How many base units in one purchase unit (e.g. 25)"
                        >
                            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 25" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            name="costPerPurchaseUnit"
                            label="Cost / Purchase Unit"
                            tooltip="Supplier price per purchase unit (e.g. 40000 RWF)"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 40000" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="stock"
                            label="Initial Stock Quantity"
                            rules={[{ required: true, message: 'Please enter initial stock' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                        <Form.Item name="stockInPurchaseUnits" valuePropName="checked" noStyle>
                            <Checkbox style={{ fontSize: '12px', marginTop: '-8px', display: 'block', marginBottom: '12px' }}>
                                Stock quantity is in Purchase Units (convert to Base Units)
                            </Checkbox>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="low_stock_threshold"
                            label="Low Stock Alert Threshold"
                            rules={[{ required: true, message: 'Please enter threshold' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={1} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="invoice_number"
                            label="Wholesaler Invoice No."
                            rules={[{ required: true, message: 'Please enter invoice number' }]}
                            tooltip="Used by retailers to add this product to their inventory"
                        >
                            <Input placeholder="e.g. WHL-INV-001" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="barcode"
                            label="Barcode"
                            rules={[{ required: true, message: 'Please enter or generate barcode' }]}
                        >
                            <Input placeholder="Scan or enter barcode" />
                        </Form.Item>
                        <Button
                            onClick={handleGenerateBarcode}
                            type="primary"
                            ghost
                            loading={generatingBarcode}
                            style={{ width: '100%', marginTop: '-8px', marginBottom: '8px' }}
                        >
                            Generate Barcode
                        </Button>
                    </Col>
                </Row>

                <Form.Item name="description" label="Description (Optional)">
                    <TextArea rows={3} placeholder="Enter product details..." />
                </Form.Item>

                <Form.Item label="Product Image">
                    <Upload.Dragger
                        listType="picture"
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setFileList(fileList.slice(-1))}
                        maxCount={1}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag image to this area to upload</p>
                    </Upload.Dragger>
                </Form.Item>
            </Form>
        </Modal>
    );
};

// Helper function to convert file to base64
const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};
