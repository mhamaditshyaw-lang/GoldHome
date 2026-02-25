import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceData {
  id: number;
  customerName: string;
  services: Array<{
    id: number;
    name: string;
    price: string;
    quantity: number;
  }>;
  expenses?: Array<{
    id: number;
    name: string;
    price: string;
  }>;
  totalAmount: string;
  status: string;
  createdAt: string;
  notes?: string;
  cleaner?: { id: number; name: string } | null;
  metadata?: any;
}

interface InvoiceSettings {
  companyName: string;
  headerText: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  templateStyle: string;
  showCompanyInfo: boolean;
  showCustomerInfo: boolean;
  showServiceDetails: boolean;
  headerImage?: string | null;
  footerImage?: string | null;
  headerWidth?: string;
  headerHeight?: string;
  footerWidth?: string;
  footerHeight?: string;
}

export async function exportInvoiceListToPDF(invoices: InvoiceData[]) {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.backgroundColor = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(container);

  // Create the report element
  const reportElement = document.createElement('div');
  reportElement.style.cssText = `
    width: 100%;
    padding: 0;
    background: white;
    color: #333;
    line-height: 1.6;
    box-sizing: border-box;
    min-height: 1000px;
  `;

  // Header
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = `
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    padding: 40px;
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  `;
  const h1 = document.createElement('h1');
  h1.style.cssText = 'font-size: 36px; margin: 0 0 10px 0; font-weight: bold;';
  h1.textContent = 'Invoice Report';

  const p1 = document.createElement('p');
  p1.style.cssText = 'font-size: 16px; margin: 0;';
  p1.textContent = 'Mali Altwni Company - For Cleaning Services';

  const p2 = document.createElement('p');
  p2.style.cssText = 'font-size: 14px; margin: 10px 0 0 0;';
  p2.textContent = `Generated on ${new Date().toLocaleDateString('en-GB')}`;

  headerDiv.appendChild(h1);
  headerDiv.appendChild(p1);
  headerDiv.appendChild(p2);

  // Summary
  const summaryDiv = document.createElement('div');
  summaryDiv.style.cssText = `
    background: white;
    padding: 30px;
    margin-bottom: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
  `;

  const totalAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

  const h2 = document.createElement('h2');
  h2.style.cssText = 'margin: 0 0 20px 0; color: #333; font-size: 24px;';
  h2.textContent = 'Summary';
  summaryDiv.appendChild(h2);

  const gridDiv = document.createElement('div');
  gridDiv.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center;';

  // Total Invoices
  const totalInvoicesDiv = document.createElement('div');
  const totalInvoicesLabel = document.createElement('div');
  totalInvoicesLabel.style.cssText = 'font-size: 14px; color: #666;';
  totalInvoicesLabel.textContent = 'Total Invoices';
  const totalInvoicesValue = document.createElement('div');
  totalInvoicesValue.style.cssText = 'font-size: 24px; font-weight: bold; color: #333;';
  totalInvoicesValue.textContent = invoices.length.toString();
  totalInvoicesDiv.appendChild(totalInvoicesLabel);
  totalInvoicesDiv.appendChild(totalInvoicesValue);

  // Total Amount
  const totalAmountDiv = document.createElement('div');
  const totalAmountLabel = document.createElement('div');
  totalAmountLabel.style.cssText = 'font-size: 14px; color: #666;';
  totalAmountLabel.textContent = 'Total Amount';
  const totalAmountValue = document.createElement('div');
  totalAmountValue.style.cssText = 'font-size: 24px; font-weight: bold; color: #333;';
  totalAmountValue.textContent = `${totalAmount.toLocaleString()} IQD`;
  totalAmountDiv.appendChild(totalAmountLabel);
  totalAmountDiv.appendChild(totalAmountValue);

  // Paid
  const paidDiv = document.createElement('div');
  const paidLabel = document.createElement('div');
  paidLabel.style.cssText = 'font-size: 14px; color: #666;';
  paidLabel.textContent = 'Paid';
  const paidValue = document.createElement('div');
  paidValue.style.cssText = 'font-size: 24px; font-weight: bold; color: #28a745;';
  paidValue.textContent = paidInvoices.toString();
  paidDiv.appendChild(paidLabel);
  paidDiv.appendChild(paidValue);

  // Pending
  const pendingDiv = document.createElement('div');
  const pendingLabel = document.createElement('div');
  pendingLabel.style.cssText = 'font-size: 14px; color: #666;';
  pendingLabel.textContent = 'Pending';
  const pendingValue = document.createElement('div');
  pendingValue.style.cssText = 'font-size: 24px; font-weight: bold; color: #ffc107;';
  pendingValue.textContent = pendingInvoices.toString();
  pendingDiv.appendChild(pendingLabel);
  pendingDiv.appendChild(pendingValue);

  gridDiv.appendChild(totalInvoicesDiv);
  gridDiv.appendChild(totalAmountDiv);
  gridDiv.appendChild(paidDiv);
  gridDiv.appendChild(pendingDiv);
  summaryDiv.appendChild(gridDiv);

  // Invoices table
  const tableDiv = document.createElement('div');
  tableDiv.style.cssText = `
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  `;

  // Table header
  const tableHeaderDiv = document.createElement('div');
  tableHeaderDiv.style.cssText = `
    display: grid;
    grid-template-columns: 80px 200px 150px 120px 120px 100px;
    background: #333;
    color: white;
    padding: 15px 20px;
    font-weight: bold;
    font-size: 14px;
  `;
  const headers = ['ID', 'Customer', 'Date', 'Amount', 'Status', 'Services'];
  headers.forEach(headerText => {
    const headerCell = document.createElement('div');
    headerCell.textContent = headerText;
    tableHeaderDiv.appendChild(headerCell);
  });

  tableDiv.appendChild(tableHeaderDiv);

  // Table rows
  invoices.forEach((invoice, index) => {
    const rowDiv = document.createElement('div');
    rowDiv.style.cssText = `
      display: grid;
      grid-template-columns: 80px 200px 150px 120px 120px 100px;
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      background: ${index % 2 === 0 ? 'white' : '#f9f9f9'};
    `;

    const statusColor = invoice.status === 'paid' ? '#28a745' :
      invoice.status === 'pending' ? '#ffc107' : '#dc3545';

    const idCell = document.createElement('div');
    idCell.style.cssText = 'font-weight: 500; color: #333;';
    idCell.textContent = `#${invoice.id}`;

    const customerCell = document.createElement('div');
    customerCell.style.cssText = 'color: #333;';
    customerCell.textContent = invoice.customerName;

    const dateCell = document.createElement('div');
    dateCell.style.cssText = 'color: #333;';
    dateCell.textContent = new Date(invoice.createdAt).toLocaleDateString('en-GB');

    const amountCell = document.createElement('div');
    amountCell.style.cssText = 'color: #333; font-weight: 500;';
    amountCell.textContent = `${parseFloat(invoice.totalAmount).toLocaleString()} IQD`;

    const statusCell = document.createElement('div');
    statusCell.style.cssText = `color: ${statusColor}; font-weight: 500; text-transform: capitalize;`;
    statusCell.textContent = invoice.status;

    const servicesCell = document.createElement('div');
    servicesCell.style.cssText = 'color: #333;';
    servicesCell.textContent = (invoice.services?.length || 0).toString();

    rowDiv.appendChild(idCell);
    rowDiv.appendChild(customerCell);
    rowDiv.appendChild(dateCell);
    rowDiv.appendChild(amountCell);
    rowDiv.appendChild(statusCell);
    rowDiv.appendChild(servicesCell);
    tableDiv.appendChild(rowDiv);
  });

  // Footer
  const footerDiv = document.createElement('div');
  footerDiv.style.cssText = `
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #333;
    padding: 25px 40px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 30px;
    text-align: center;
    font-weight: bold;
    margin-top: 30px;
  `;

  // Call section
  const callDiv = document.createElement('div');
  const callTitle = document.createElement('div');
  callTitle.style.cssText = 'font-size: 18px; margin-bottom: 8px;';
  callTitle.textContent = 'Call';
  const phone1 = document.createElement('div');
  phone1.style.cssText = 'font-size: 14px; margin-bottom: 3px;';
  phone1.textContent = '096477034043';
  const phone2 = document.createElement('div');
  phone2.style.cssText = 'font-size: 14px;';
  phone2.textContent = '096475017950';
  callDiv.appendChild(callTitle);
  callDiv.appendChild(phone1);
  callDiv.appendChild(phone2);

  // Email section
  const emailDiv = document.createElement('div');
  const emailTitle = document.createElement('div');
  emailTitle.style.cssText = 'font-size: 18px; margin-bottom: 8px;';
  emailTitle.textContent = 'Email';
  const emailValue = document.createElement('div');
  emailValue.style.cssText = 'font-size: 14px;';
  emailValue.textContent = 'Info@malialtni.com';
  emailDiv.appendChild(emailTitle);
  emailDiv.appendChild(emailValue);

  // Website section
  const websiteDiv = document.createElement('div');
  const websiteTitle = document.createElement('div');
  websiteTitle.style.cssText = 'font-size: 18px; margin-bottom: 8px;';
  websiteTitle.textContent = 'Website';
  const websiteValue = document.createElement('div');
  websiteValue.style.cssText = 'font-size: 14px;';
  websiteValue.textContent = 'www.malialtni.com';
  websiteDiv.appendChild(websiteTitle);
  websiteDiv.appendChild(websiteValue);

  footerDiv.appendChild(callDiv);
  footerDiv.appendChild(emailDiv);
  footerDiv.appendChild(websiteDiv);

  // Assemble the complete document
  reportElement.appendChild(headerDiv);
  reportElement.appendChild(summaryDiv);
  reportElement.appendChild(tableDiv);
  reportElement.appendChild(footerDiv);

  container.appendChild(reportElement);

  try {
    // Convert to canvas and then PDF
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`invoice-report-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

export async function exportInvoiceToPDF(invoice: InvoiceData, settings?: InvoiceSettings) {
  // Default settings if none provided
  const defaultSettings: InvoiceSettings = {
    companyName: 'Mali Altwni Company',
    headerText: '', // No header text needed since new banner includes subtitle
    footerText: '',
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    accentColor: '#333333',
    templateStyle: 'modern',
    showCompanyInfo: true,
    showCustomerInfo: true,
    showServiceDetails: true,
    headerImage: null,
    footerImage: null,
    headerWidth: '100',
    headerHeight: '120',
    footerWidth: '100',
    footerHeight: '60'
  };

  const finalSettings = settings || defaultSettings;
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.height = '1120px'; // A4 height constraint
  container.style.backgroundColor = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(container);

  // Create the invoice element - Optimized for single page
  const invoiceElement = document.createElement('div');
  invoiceElement.style.cssText = `
    width: 100%;
    padding: 0;
    background: white;
    color: #333;
    line-height: 1.4;
    box-sizing: border-box;
    min-height: 1120px;
    height: 1120px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  // Fixed Header Section - Full Width
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = `
    width: 100%;
    padding: 0;
    text-align: center;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    margin-bottom: 0;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  let headerContent = '';
  // Add full-width header image
  if (finalSettings.headerImage) {
    const imageContainerDiv = document.createElement('div');
    const headerHeightPx = finalSettings.headerHeight ? `${finalSettings.headerHeight}px` : '120px';
    imageContainerDiv.style.cssText = `width: 100%; height: ${headerHeightPx}; overflow: hidden; position: relative;`;

    const img = document.createElement('img');
    img.src = finalSettings.headerImage;
    img.alt = 'Header Logo';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; object-position: center;';

    imageContainerDiv.appendChild(img);
    headerDiv.appendChild(imageContainerDiv);
  } else {
    // New Mali Altwni Company header design
    const logoContainerDiv = document.createElement('div');
    logoContainerDiv.style.cssText = 'width: 100%; height: 120px; display: flex; align-items: center; position: relative; background: linear-gradient(90deg, #FFD700 0%, #FFA500 40%, #FFD700 100%); overflow: hidden;';

    // Create chevron/arrow design elements
    const chevronDiv1 = document.createElement('div');
    chevronDiv1.style.cssText = 'position: absolute; left: 0; top: 0; width: 120px; height: 100%; background: #333; transform: skew(-20deg); transform-origin: bottom;';

    const chevronDiv2 = document.createElement('div');
    chevronDiv2.style.cssText = 'position: absolute; left: 80px; top: 0; width: 120px; height: 100%; background: #444; transform: skew(-20deg); transform-origin: bottom;';

    const chevronDiv3 = document.createElement('div');
    chevronDiv3.style.cssText = 'position: absolute; left: 160px; top: 0; width: 120px; height: 100%; background: #333; transform: skew(-20deg); transform-origin: bottom;';

    // Company logo circle
    const logoCircle = document.createElement('div');
    logoCircle.style.cssText = 'position: absolute; right: 150px; top: 50%; transform: translateY(-50%); width: 60px; height: 60px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #FFD700;';

    const logoText = document.createElement('div');
    logoText.style.cssText = 'color: #FFD700; font-size: 20px; font-weight: bold;';
    logoText.textContent = 'MA';

    logoCircle.appendChild(logoText);

    // Company text section
    const textDiv = document.createElement('div');
    textDiv.style.cssText = 'position: absolute; right: 30px; top: 50%; transform: translateY(-50%); text-align: right; z-index: 10;';

    const companyName = document.createElement('div');
    companyName.style.cssText = 'font-size: 28px; font-weight: bold; color: #333; margin-bottom: 2px; line-height: 1;';
    companyName.textContent = 'Mali Altwni Company';

    const companyDesc = document.createElement('div');
    companyDesc.style.cssText = 'font-size: 16px; color: #333; font-weight: 500;';
    companyDesc.textContent = 'For Cleaning Services';

    textDiv.appendChild(companyName);
    textDiv.appendChild(companyDesc);

    logoContainerDiv.appendChild(chevronDiv1);
    logoContainerDiv.appendChild(chevronDiv2);
    logoContainerDiv.appendChild(chevronDiv3);
    logoContainerDiv.appendChild(logoCircle);
    logoContainerDiv.appendChild(textDiv);
    headerDiv.appendChild(logoContainerDiv);
  }

  // Add header text below image
  if (finalSettings.headerText) {
    const headerTextDiv = document.createElement('div');
    headerTextDiv.style.cssText = 'padding: 15px 20px; background: rgba(255, 255, 255, 0.9); margin-top: -1px;';

    const headerTextContent = document.createElement('div');
    headerTextContent.style.cssText = 'font-size: 18px; color: #333; font-weight: bold;';
    headerTextContent.textContent = finalSettings.headerText;

    headerTextDiv.appendChild(headerTextContent);
    headerDiv.appendChild(headerTextDiv);
  }

  // Main content area - Optimized for single page
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    padding: 25px 30px;
    background: white;
    margin-top: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  `;

  // Invoice Pay title - Reduced size for single page
  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = `
    text-align: center;
    margin-bottom: 20px;
  `;
  const titleH1 = document.createElement('h1');
  titleH1.style.cssText = 'font-size: 28px; color: #333; margin: 0; letter-spacing: 1px; font-weight: bold;';
  titleH1.textContent = 'INVOICE PAY';
  titleDiv.appendChild(titleH1);

  // Service info and invoice number section - Compressed
  const infoSectionDiv = document.createElement('div');
  infoSectionDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    background: white;
    padding: 15px 20px;
    border-radius: 6px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
  `;

  const leftInfoDiv = document.createElement('div');
  const serviceTitle = document.createElement('h2');
  serviceTitle.style.cssText = 'margin: 0 0 8px 0; color: #333; font-size: 18px; font-weight: bold;';
  serviceTitle.textContent = 'Cleaning And Transfer';

  const forDiv = document.createElement('div');
  forDiv.style.cssText = 'color: #666; font-size: 13px; margin-bottom: 10px;';
  const forLabel = document.createElement('strong');
  forLabel.textContent = 'FOR: ';
  forDiv.appendChild(forLabel);
  forDiv.appendChild(document.createTextNode(invoice.customerName));

  const infoContainer = document.createElement('div');
  infoContainer.style.cssText = 'color: #333; font-size: 14px;';

  const dateDiv = document.createElement('div');
  dateDiv.style.cssText = 'color: #666; font-size: 13px; margin-bottom: 8px;';
  const dateLabel = document.createElement('strong');
  dateLabel.textContent = 'Date: ';
  dateDiv.appendChild(dateLabel);
  dateDiv.appendChild(document.createTextNode(new Date(invoice.createdAt).toLocaleDateString('en-GB')));

  const invoiceNoDiv = document.createElement('div');
  invoiceNoDiv.style.cssText = 'color: #666; font-size: 13px;';
  const invoiceNoLabel = document.createElement('strong');
  invoiceNoLabel.textContent = 'Invoice No: ';
  invoiceNoDiv.appendChild(invoiceNoLabel);
  invoiceNoDiv.appendChild(document.createTextNode(`#${invoice.id}`));

  infoContainer.appendChild(dateDiv);
  infoContainer.appendChild(invoiceNoDiv);

  leftInfoDiv.appendChild(serviceTitle);
  leftInfoDiv.appendChild(forDiv);
  leftInfoDiv.appendChild(infoContainer);

  const rightInfoDiv = document.createElement('div');
  rightInfoDiv.style.cssText = 'text-align: right;';
  const invoiceLabel = document.createElement('div');
  invoiceLabel.style.cssText = 'color: #666; font-size: 13px; margin-bottom: 3px;';
  invoiceLabel.textContent = 'INVOICE';

  const invoiceNumber = document.createElement('div');
  invoiceNumber.style.cssText = 'font-size: 26px; font-weight: bold; color: #333;';
  invoiceNumber.textContent = `#${invoice.id}`;

  rightInfoDiv.appendChild(invoiceLabel);
  rightInfoDiv.appendChild(invoiceNumber);

  infoSectionDiv.appendChild(leftInfoDiv);
  infoSectionDiv.appendChild(rightInfoDiv);

  // Services table - Compressed for single page
  const tableDiv = document.createElement('div');
  tableDiv.style.cssText = `
    background: white;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
    margin-bottom: 15px;
  `;

  // Table header
  const tableHeaderDiv = document.createElement('div');
  tableHeaderDiv.style.cssText = `
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    background: #333;
    color: white;
    padding: 15px 20px;
    font-weight: bold;
    font-size: 14px;
  `;
  const companyHeader = document.createElement('div');
  companyHeader.textContent = 'COMPANYA 🏢';

  const priceHeader = document.createElement('div');
  priceHeader.style.cssText = 'text-align: center;';
  priceHeader.textContent = 'PRICE';

  const qtyHeader = document.createElement('div');
  qtyHeader.style.cssText = 'text-align: center;';
  qtyHeader.textContent = 'QTY WORK';

  const totalHeader = document.createElement('div');
  totalHeader.style.cssText = 'text-align: right;';
  totalHeader.textContent = 'TOTAL';

  tableHeaderDiv.appendChild(companyHeader);
  tableHeaderDiv.appendChild(priceHeader);
  tableHeaderDiv.appendChild(qtyHeader);
  tableHeaderDiv.appendChild(totalHeader);

  tableDiv.appendChild(tableHeaderDiv);

  // Table rows
  if (invoice.services && invoice.services.length > 0) {
    invoice.services.forEach((service) => {
      const rowDiv = document.createElement('div');
      rowDiv.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        background: white;
      `;

      const total = parseFloat(service.price) * service.quantity;

      const nameCell = document.createElement('div');
      nameCell.style.cssText = 'font-weight: 500; color: #333;';
      nameCell.textContent = service.name;

      const priceCell = document.createElement('div');
      priceCell.style.cssText = 'text-align: center; color: #333;';
      priceCell.textContent = `${parseFloat(service.price).toLocaleString()} IQD`;

      const quantityCell = document.createElement('div');
      quantityCell.style.cssText = 'text-align: center; color: #333;';
      quantityCell.textContent = service.quantity.toString();

      const totalCell = document.createElement('div');
      totalCell.style.cssText = 'text-align: right; font-weight: bold; color: #333;';
      totalCell.textContent = `${total.toLocaleString()} IQD`;

      rowDiv.appendChild(nameCell);
      rowDiv.appendChild(priceCell);
      rowDiv.appendChild(quantityCell);
      rowDiv.appendChild(totalCell);
      tableDiv.appendChild(rowDiv);
    });
  } else {
    // Default Mir House entry
    const defaultRowDiv = document.createElement('div');
    defaultRowDiv.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      background: white;
    `;
    const defaultNameCell = document.createElement('div');
    defaultNameCell.style.cssText = 'font-weight: 500; color: #333;';
    defaultNameCell.textContent = 'Mir House';

    const defaultPriceCell = document.createElement('div');
    defaultPriceCell.style.cssText = 'text-align: center; color: #333;';
    defaultPriceCell.textContent = '600.000 IQD';

    const defaultQuantityCell = document.createElement('div');
    defaultQuantityCell.style.cssText = 'text-align: center; color: #333;';
    defaultQuantityCell.textContent = '2';

    const defaultTotalCell = document.createElement('div');
    defaultTotalCell.style.cssText = 'text-align: right; font-weight: bold; color: #333;';
    defaultTotalCell.textContent = '600.000 IQD';

    defaultRowDiv.appendChild(defaultNameCell);
    defaultRowDiv.appendChild(defaultPriceCell);
    defaultRowDiv.appendChild(defaultQuantityCell);
    defaultRowDiv.appendChild(defaultTotalCell);
    tableDiv.appendChild(defaultRowDiv);
  }

  // Expenses table - Add if expenses exist
  let expensesTableDiv: HTMLElement | null = null;
  if (invoice.expenses && invoice.expenses.length > 0) {
    expensesTableDiv = document.createElement('div');
    expensesTableDiv.style.cssText = `
      background: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
      margin-bottom: 15px;
    `;

    // Expenses table header
    const expensesHeaderDiv = document.createElement('div');
    expensesHeaderDiv.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr;
      background: #2d5016;
      color: white;
      padding: 12px 20px;
      font-weight: bold;
      font-size: 14px;
    `;
    const expenseNameHeader = document.createElement('div');
    expenseNameHeader.textContent = 'EXPENSE 💰';

    const expenseAmountHeader = document.createElement('div');
    expenseAmountHeader.style.cssText = 'text-align: right;';
    expenseAmountHeader.textContent = 'AMOUNT';

    expensesHeaderDiv.appendChild(expenseNameHeader);
    expensesHeaderDiv.appendChild(expenseAmountHeader);
    expensesTableDiv!.appendChild(expensesHeaderDiv);

    // Expense rows
    let expensesTotal = 0;
    invoice.expenses.forEach((expense) => {
      const expenseRowDiv = document.createElement('div');
      expenseRowDiv.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding: 12px 20px;
        border-bottom: 1px solid #eee;
        background: #f9fff5;
      `;

      const amount = parseFloat(expense.price);
      expensesTotal += amount;

      const expenseNameCell = document.createElement('div');
      expenseNameCell.style.cssText = 'font-weight: 500; color: #333;';
      expenseNameCell.textContent = expense.name;

      const expenseAmountCell = document.createElement('div');
      expenseAmountCell.style.cssText = 'text-align: right; font-weight: bold; color: #2d5016;';
      expenseAmountCell.textContent = `${amount.toLocaleString()} IQD`;

      expenseRowDiv.appendChild(expenseNameCell);
      expenseRowDiv.appendChild(expenseAmountCell);
      expensesTableDiv!.appendChild(expenseRowDiv);
    });

    // Expenses total row
    const expensesTotalRow = document.createElement('div');
    expensesTotalRow.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr;
      padding: 12px 20px;
      background: #e8f5e0;
      font-weight: bold;
    `;

    const expensesTotalLabel = document.createElement('div');
    expensesTotalLabel.style.cssText = 'color: #2d5016;';
    expensesTotalLabel.textContent = 'EXPENSES TOTAL';

    const expensesTotalValue = document.createElement('div');
    expensesTotalValue.style.cssText = 'text-align: right; color: #2d5016; font-size: 16px;';
    expensesTotalValue.textContent = `${expensesTotal.toLocaleString()} IQD`;

    expensesTotalRow.appendChild(expensesTotalLabel);
    expensesTotalRow.appendChild(expensesTotalValue);
    expensesTableDiv!.appendChild(expensesTotalRow);
  }

  // Materials table - Add if materials exist in metadata
  let materialsTableDiv: HTMLElement | null = null;
  const meta = invoice.metadata || {};
  const materialsList = meta.materials || [];
  if (materialsList.length > 0 || meta.materialName) {
    materialsTableDiv = document.createElement('div');
    materialsTableDiv.style.cssText = `
      background: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
      margin-bottom: 15px;
    `;

    const materialsHeaderDiv = document.createElement('div');
    materialsHeaderDiv.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr;
      background: #7c3aed;
      color: white;
      padding: 12px 20px;
      font-weight: bold;
      font-size: 14px;
    `;
    const matNameHeader = document.createElement('div');
    matNameHeader.textContent = 'MATERIALS 📦';
    const matPriceHeader = document.createElement('div');
    matPriceHeader.style.cssText = 'text-align: right;';
    matPriceHeader.textContent = 'COST';
    materialsHeaderDiv.appendChild(matNameHeader);
    materialsHeaderDiv.appendChild(matPriceHeader);
    materialsTableDiv.appendChild(materialsHeaderDiv);

    const displayMaterials = [...materialsList];
    if (displayMaterials.length === 0 && meta.materialName) {
      displayMaterials.push({ name: meta.materialName, price: meta.materialPrice || "0" });
    }

    displayMaterials.forEach((m: any) => {
      const matRow = document.createElement('div');
      matRow.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding: 10px 20px;
        border-bottom: 1px solid #eee;
        background: #fdfaff;
      `;
      const matNameCell = document.createElement('div');
      matNameCell.style.cssText = 'font-weight: 500; color: #333;';
      matNameCell.textContent = m.name;
      const matPriceCell = document.createElement('div');
      matPriceCell.style.cssText = 'text-align: right; font-weight: bold; color: #7c3aed;';
      matPriceCell.textContent = `${parseFloat(m.price || "0").toLocaleString()} IQD`;
      matRow.appendChild(matNameCell);
      matRow.appendChild(matPriceCell);
      materialsTableDiv!.appendChild(matRow);
    });
  }

  // Payment info section - Compressed
  const paymentInfoDiv = document.createElement('div');
  paymentInfoDiv.style.cssText = `
    background: white;
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;

  const paymentLeftDiv = document.createElement('div');
  paymentLeftDiv.style.cssText = 'float: left; width: 50%;';
  const paymentTitle = document.createElement('h3');
  paymentTitle.style.cssText = 'margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold;';
  paymentTitle.textContent = 'PAYMENT INFO:';

  const paymentDetails = document.createElement('div');
  paymentDetails.style.cssText = 'font-size: 11px; line-height: 1.4; color: #555;';

  const bankNameDiv = document.createElement('div');
  const bankNameLabel = document.createElement('strong');
  bankNameLabel.textContent = 'BANK NAME: ';
  bankNameDiv.appendChild(bankNameLabel);
  bankNameDiv.appendChild(document.createTextNode('FIRST BANK IRAQ / FIB'));

  const accountDiv = document.createElement('div');
  const accountLabel = document.createElement('strong');
  accountLabel.textContent = 'ACCOUNT NAME OR IB: ';
  accountDiv.appendChild(accountLabel);
  accountDiv.appendChild(document.createTextNode('096477089305'));

  const cihanDiv = document.createElement('div');
  const cihanLabel = document.createElement('strong');
  cihanLabel.textContent = 'CIHAN BANK: ';
  cihanDiv.appendChild(cihanLabel);
  cihanDiv.appendChild(document.createTextNode('/ 68862'));

  const ibanDiv = document.createElement('div');
  const ibanLabel = document.createElement('strong');
  ibanLabel.textContent = 'IQ50CHB013100086601';
  ibanDiv.appendChild(ibanLabel);

  paymentDetails.appendChild(bankNameDiv);
  paymentDetails.appendChild(accountDiv);
  paymentDetails.appendChild(cihanDiv);
  paymentDetails.appendChild(ibanDiv);

  paymentLeftDiv.appendChild(paymentTitle);
  paymentLeftDiv.appendChild(paymentDetails);

  const paymentRightDiv = document.createElement('div');
  paymentRightDiv.style.cssText = 'float: right; width: 45%; text-align: right;';
  const subtotalContainer = document.createElement('div');
  subtotalContainer.style.cssText = 'margin-bottom: 10px;';

  const subtotalLabel = document.createElement('div');
  subtotalLabel.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 3px;';
  subtotalLabel.textContent = 'SUBTOTAL';

  const subtotalValue = document.createElement('div');
  subtotalValue.style.cssText = 'font-size: 16px; font-weight: bold; color: #333;';
  subtotalValue.textContent = `${parseFloat(invoice.totalAmount).toLocaleString()} IQD`;

  subtotalContainer.appendChild(subtotalLabel);
  subtotalContainer.appendChild(subtotalValue);

  const totalContainer = document.createElement('div');
  totalContainer.style.cssText = 'margin-bottom: 15px;';

  const totalLabel = document.createElement('div');
  totalLabel.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 3px;';
  totalLabel.textContent = 'TOTAL';

  const totalValue = document.createElement('div');
  totalValue.style.cssText = 'font-size: 20px; font-weight: bold; color: #333;';
  totalValue.textContent = `${parseFloat(invoice.totalAmount).toLocaleString()} IQD`;

  totalContainer.appendChild(totalLabel);
  totalContainer.appendChild(totalValue);

  const separatorDiv = document.createElement('div');
  separatorDiv.style.cssText = 'border-top: 2px solid #333; width: 120px; margin: 10px 0 5px auto;';

  const managerTitle = document.createElement('div');
  managerTitle.style.cssText = 'font-weight: bold; color: #333; font-size: 12px;';
  managerTitle.textContent = 'MANAGER';

  const managerName = document.createElement('div');
  managerName.style.cssText = 'font-size: 10px; color: #666;';
  managerName.textContent = 'Huda Harbi Jamal';

  paymentRightDiv.appendChild(subtotalContainer);
  paymentRightDiv.appendChild(totalContainer);
  paymentRightDiv.appendChild(separatorDiv);
  paymentRightDiv.appendChild(managerTitle);
  paymentRightDiv.appendChild(managerName);

  const clearDiv = document.createElement('div');
  clearDiv.style.cssText = 'clear: both;';

  paymentInfoDiv.appendChild(paymentLeftDiv);
  paymentInfoDiv.appendChild(paymentRightDiv);
  paymentInfoDiv.appendChild(clearDiv);

  // Custom Footer Section - Full Width
  let customFooterDiv: HTMLElement | null = null;
  if (finalSettings.footerText || finalSettings.footerImage) {
    customFooterDiv = document.createElement('div');
    customFooterDiv.style.cssText = `
      width: 100%;
      padding: 0;
      text-align: center;
      background: linear-gradient(135deg, #FFF8DC 0%, #F5F5DC 100%);
      border-top: 2px solid #FFD700;
      margin-top: auto;
      position: relative;
    `;

    let footerContent = '';
    if (finalSettings.footerImage) {
      const footerImageDiv = document.createElement('div');
      const footerHeightPx = finalSettings.footerHeight ? `${finalSettings.footerHeight}px` : '60px';
      footerImageDiv.style.cssText = `width: 100%; height: ${footerHeightPx}; overflow: hidden;`;

      const footerImg = document.createElement('img');
      footerImg.src = finalSettings.footerImage;
      footerImg.alt = 'Footer Logo';
      footerImg.style.cssText = 'width: 100%; height: 100%; object-fit: cover; object-position: center;';

      footerImageDiv.appendChild(footerImg);
      customFooterDiv.appendChild(footerImageDiv);
    }
    if (finalSettings.footerText) {
      const footerTextContainerDiv = document.createElement('div');
      footerTextContainerDiv.style.cssText = 'padding: 10px 20px; background: rgba(255, 255, 255, 0.8);';

      const footerTextDiv = document.createElement('div');
      footerTextDiv.style.cssText = 'font-size: 12px; color: #333; font-weight: bold;';
      footerTextDiv.textContent = finalSettings.footerText;

      footerTextContainerDiv.appendChild(footerTextDiv);
      customFooterDiv.appendChild(footerTextContainerDiv);
    }
  }

  // Fixed Company Footer - Full Width
  const companyFooterDiv = document.createElement('div');
  companyFooterDiv.style.cssText = `
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #333;
    padding: 20px 30px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    text-align: center;
    font-weight: bold;
    width: 100%;
    margin-top: 0;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  `;

  // Call section
  const companyCallDiv = document.createElement('div');
  const callTitleDiv = document.createElement('div');
  callTitleDiv.style.cssText = 'font-size: 16px; margin-bottom: 6px;';
  callTitleDiv.textContent = '📞 Call';
  const call1Div = document.createElement('div');
  call1Div.style.cssText = 'font-size: 12px; margin-bottom: 2px;';
  call1Div.textContent = '096477034043';
  const call2Div = document.createElement('div');
  call2Div.style.cssText = 'font-size: 12px;';
  call2Div.textContent = '096475017950';
  companyCallDiv.appendChild(callTitleDiv);
  companyCallDiv.appendChild(call1Div);
  companyCallDiv.appendChild(call2Div);

  // Email section
  const companyEmailDiv = document.createElement('div');
  const emailTitleDiv = document.createElement('div');
  emailTitleDiv.style.cssText = 'font-size: 16px; margin-bottom: 6px;';
  emailTitleDiv.textContent = '📧 Email';
  const emailValueDiv = document.createElement('div');
  emailValueDiv.style.cssText = 'font-size: 12px;';
  emailValueDiv.textContent = 'Info@malialtni.com';
  companyEmailDiv.appendChild(emailTitleDiv);
  companyEmailDiv.appendChild(emailValueDiv);

  // Website section
  const companyWebsiteDiv = document.createElement('div');
  const websiteTitleDiv = document.createElement('div');
  websiteTitleDiv.style.cssText = 'font-size: 16px; margin-bottom: 6px;';
  websiteTitleDiv.textContent = '🌐 Website';
  const websiteValueDiv = document.createElement('div');
  websiteValueDiv.style.cssText = 'font-size: 12px;';
  websiteValueDiv.textContent = 'www.malialtni.com';
  companyWebsiteDiv.appendChild(websiteTitleDiv);
  companyWebsiteDiv.appendChild(websiteValueDiv);

  companyFooterDiv.appendChild(companyCallDiv);
  companyFooterDiv.appendChild(companyEmailDiv);
  companyFooterDiv.appendChild(companyWebsiteDiv);

  // Assemble the complete document  
  const mainContentDiv = document.createElement('div');
  mainContentDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column;';

  mainContentDiv.appendChild(titleDiv);
  mainContentDiv.appendChild(infoSectionDiv);
  mainContentDiv.appendChild(tableDiv);
  if (expensesTableDiv) {
    mainContentDiv.appendChild(expensesTableDiv);
  }
  if (materialsTableDiv) {
    mainContentDiv.appendChild(materialsTableDiv);
  }
  mainContentDiv.appendChild(paymentInfoDiv);

  contentDiv.appendChild(mainContentDiv);

  // Add header (always present)
  invoiceElement.appendChild(headerDiv);

  // Add main content with flexible height
  contentDiv.style.flex = '1 1 auto';
  invoiceElement.appendChild(contentDiv);

  // Add custom footer if exists
  if (customFooterDiv) {
    invoiceElement.appendChild(customFooterDiv);
  }

  // Add company footer
  invoiceElement.appendChild(companyFooterDiv);

  container.appendChild(invoiceElement);

  try {
    // Convert to canvas and then PDF - Single page optimized
    const canvas = await html2canvas(invoiceElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      height: 1120,
      width: 794
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Ensure it fits on one page
    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
    }

    // Add single page image
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    pdf.save(`invoice-${invoice.id}-mali-altwni.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}