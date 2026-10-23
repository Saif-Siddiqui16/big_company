/**
 * Centralized Thermal Receipt Printer
 * Matches the official BIG thermal receipt format (58mm/80mm roll)
 * Uses an isolated off-screen iframe for 100% reliable desktop printing across all browsers
 */

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: string;
  sku?: string;
}

export interface ReceiptData {
  receiptNo: string;
  date: Date | string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  cashReceived?: number;
  change?: number;
  customerName?: string;
  customerPhone?: string;
  retailerName?: string;
  gasRewardWalletId?: string;
  receiptTitle?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
}

/**
 * Generates the clean thermal receipt HTML matching the physical slip
 */
export function generateThermalReceiptHtml(data: ReceiptData): string {
  const storeName = data.storeName || 'Big Innovation Group Ltd';
  const storeAddress = data.storeAddress || 'Kigali, Rwanda';
  const storePhone = data.storePhone || '+250788541239';
  const storeEmail = data.storeEmail || 'info@big.co.rw';
  const receiptTitle = data.receiptTitle || 'OFFICIAL SALES RECEIPT';

  const subtotalVal = Number(data.subtotal ?? data.total ?? 0);
  const totalVal = Number(data.total ?? subtotalVal ?? 0);
  const taxVal = Number(data.tax ?? Math.round((totalVal * 0.18) / 1.18));
  const discountVal = Number(data.discount ?? 0);
  const cashReceivedVal = data.cashReceived !== undefined ? Number(data.cashReceived) : undefined;
  const changeVal = data.change !== undefined ? Number(data.change) : undefined;

  const formattedDate = (() => {
    try {
      const d = typeof data.date === 'string' ? new Date(data.date) : data.date;
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return String(data.date);
    }
  })();

  const itemsHtml = (data.items || [])
    .map((item) => {
      const uPrice = Number(item.unitPrice ?? 0);
      const qty = Number(item.quantity ?? 1);
      const itemTotal = Number(item.total ?? uPrice * qty);
      const unitStr = uPrice ? `Unit: ${uPrice.toLocaleString()} RWF` : '';

      return `
        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <div style="font-weight: 600; font-size: 11px; line-height: 1.2;">${escapeHtml(item.name)}</div>
            ${unitStr ? `<div style="font-size: 9px; color: #444; margin-top: 1px;">${unitStr}</div>` : ''}
          </td>
          <td style="padding: 4px 2px; text-align: center; vertical-align: top; font-size: 11px; font-weight: 500;">
            ${qty}
          </td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; font-size: 11px; font-weight: 700;">
            ${itemTotal.toLocaleString()}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.receiptNo)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 72mm !important;
        margin: 0 auto !important;
        padding: 4mm 0 !important;
        background: #fff !important;
      }
      .no-print { display: none !important; }
    }
    html, body {
      width: 72mm;
      margin: 0 auto;
      padding: 4mm 0;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000;
      font-size: 11px;
      line-height: 1.3;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * {
      box-sizing: border-box;
      color: #000;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
      width: 100%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <!-- Header / Branding -->
  <div style="text-align: center; margin-bottom: 4px;">
    <img
      src="/logo-big.png"
      alt="BIG"
      style="height: 40px; max-width: 110px; object-fit: contain; display: block; margin: 0 auto 4px;"
      onerror="this.style.display='none'"
    />
    <div style="font-size: 15px; font-weight: 800; line-height: 1.15; letter-spacing: -0.2px;">
      ${escapeHtml(storeName)}
    </div>
    <div style="font-size: 9.5px; color: #333; margin-top: 3px; line-height: 1.2;">
      ${escapeHtml(storeAddress)} | ${escapeHtml(storePhone)}<br />
      ${escapeHtml(storeEmail)}
    </div>
    <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
      ${escapeHtml(receiptTitle)}
    </div>
  </div>

  <div class="divider"></div>

  <!-- Receipt Metadata -->
  <table style="font-size: 11px; margin-bottom: 2px;">
    <tr>
      <td style="padding: 2px 0; text-align: left; color: #333;">Receipt No:</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700;">${escapeHtml(data.receiptNo)}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0; text-align: left; color: #333;">Date:</td>
      <td style="padding: 2px 0; text-align: right;">${formattedDate}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0; text-align: left; color: #333;">Payment Method:</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700; text-transform: uppercase;">
        ${escapeHtml((data.paymentMethod || 'CASH').replace(/_/g, ' '))}
      </td>
    </tr>
    ${
      data.customerName
        ? `<tr>
            <td style="padding: 2px 0; text-align: left; color: #333;">Customer:</td>
            <td style="padding: 2px 0; text-align: right;">${escapeHtml(data.customerName)}</td>
          </tr>`
        : ''
    }
    ${
      data.retailerName
        ? `<tr>
            <td style="padding: 2px 0; text-align: left; color: #333;">Retailer:</td>
            <td style="padding: 2px 0; text-align: right;">${escapeHtml(data.retailerName)}</td>
          </tr>`
        : ''
    }
  </table>

  <div class="divider"></div>

  <!-- Line Items Table -->
  <table style="font-size: 11px; margin-bottom: 2px;">
    <thead>
      <tr style="border-bottom: 1px dashed #000;">
        <th style="padding: 3px 0; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;">
          ITEM<br />DESCRIPTION
        </th>
        <th style="padding: 3px 2px; text-align: center; font-size: 9.5px; font-weight: 700; width: 14%;">
          QTY
        </th>
        <th style="padding: 3px 0; text-align: right; font-size: 9.5px; font-weight: 700; width: 26%;">
          PRICE
        </th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- Totals Section -->
  <table style="font-size: 11px; margin-bottom: 4px;">
    <tr>
      <td style="padding: 2px 0; text-align: left; color: #333;">Subtotal</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 600;">${subtotalVal.toLocaleString()} RWF</td>
    </tr>
    <tr>
      <td style="padding: 2px 0; text-align: left; color: #333;">Tax (18% VAT Included)</td>
      <td style="padding: 2px 0; text-align: right;">${taxVal.toLocaleString()} RWF</td>
    </tr>
    ${
      discountVal > 0
        ? `<tr>
            <td style="padding: 2px 0; text-align: left; color: #333;">Discount</td>
            <td style="padding: 2px 0; text-align: right;">-${discountVal.toLocaleString()} RWF</td>
          </tr>`
        : ''
    }
    ${
      cashReceivedVal !== undefined
        ? `<tr>
            <td style="padding: 2px 0; text-align: left; color: #333;">Cash Received</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 600;">${cashReceivedVal.toLocaleString()} RWF</td>
          </tr>`
        : ''
    }
    ${
      changeVal !== undefined
        ? `<tr>
            <td style="padding: 2px 0; text-align: left; color: #333;">Change Return</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 600;">${changeVal.toLocaleString()} RWF</td>
          </tr>`
        : ''
    }
  </table>

  <div class="divider"></div>

  <!-- Big Total Amount -->
  <div style="text-align: center; padding: 6px 0; margin-bottom: 4px;">
    <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
      TOTAL AMOUNT
    </div>
    <div style="font-size: 21px; font-weight: 900; line-height: 1.2; margin-top: 2px;">
      ${totalVal.toLocaleString()} RWF
    </div>
  </div>

  ${
    data.gasRewardWalletId
      ? `<div style="text-align: center; font-size: 10px; border: 1px dashed #666; padding: 4px; margin: 6px 0;">
          Rewards linked to: <b>${escapeHtml(data.gasRewardWalletId)}</b>
        </div>`
      : ''
  }

  <div class="divider"></div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 6px; padding-bottom: 8px;">
    <div style="font-size: 12px; font-weight: 700; margin-bottom: 2px;">Thank you for shopping!</div>
    <div style="font-size: 9.5px; color: #333;">For support: ${escapeHtml(storePhone)} | ${escapeHtml(storeEmail)}</div>
    <div style="font-size: 9px; color: #555; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
      PROCESSED BY ${escapeHtml(storeName)}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Executes direct printing using an off-screen iframe.
 * Guarantees that only the receipt is printed and opens print dialog automatically across all browsers.
 */
export function printThermalReceipt(data: ReceiptData, options: { autoPrint?: boolean } = { autoPrint: true }): Promise<void> {
  return new Promise((resolve) => {
    try {
      const html = generateThermalReceiptHtml(data);

      // Clean up previous print iframe if it exists
      const oldIframe = document.getElementById('thermal-receipt-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'thermal-receipt-iframe';
      // Position off-screen (not visibility:hidden, so Chromium PrintManager won't block it)
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '80mm';
      iframe.style.height = '600px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        resolve();
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      if (options.autoPrint) {
        // Allow images & styles to render then print
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Receipt print failed', e);
          }
          resolve();
        }, 200);
      } else {
        resolve();
      }
    } catch (err) {
      console.error('printThermalReceipt error:', err);
      resolve();
    }
  });
}
