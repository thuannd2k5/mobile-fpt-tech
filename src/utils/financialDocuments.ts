import * as Print from "expo-print";

export interface FinancialDocumentDetails {
  title: string;
  documentCode: string;
  invoiceCode: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  className: string;
  amount: number;
  discountAmount?: number;
  finalAmount: number;
  status?: string;
  paymentMethod?: string;
  date?: string;
}

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export const financialDocumentHtml = (document: FinancialDocumentDetails) => {
  const rows: [string, string | number | undefined][] = [
    ["Học viên", document.studentName],
    ["Email", document.studentEmail],
    ["Khóa học", document.courseName],
    ["Lớp học", document.className],
    ["Hóa đơn", document.invoiceCode],
    ["Số tiền gốc", money(document.amount)],
    ["Giảm trừ", money(document.discountAmount || 0)],
    ["Thành tiền", money(document.finalAmount)],
    ["Trạng thái", document.status],
    ["Phương thức", document.paymentMethod],
    ["Ngày lập / ghi nhận", document.date],
  ];
  const visibleRows = rows.filter(
    ([, value]) => value !== undefined && value !== "",
  );

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(document.title)} ${escapeHtml(document.documentCode)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #172033; padding: 32px; }
    header { border-bottom: 2px solid #f26522; padding-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 28px 0 8px; text-align: center; }
    .brand { color: #f26522; font-size: 13px; font-weight: 700; }
    .code { color: #64748b; font-size: 12px; }
    table { border-collapse: collapse; margin-top: 20px; width: 100%; }
    td { border-bottom: 1px solid #e2e8f0; padding: 10px 6px; font-size: 13px; }
    td:first-child { color: #64748b; width: 38%; }
    .total td { font-weight: 700; color: #c2410c; }
    footer { color: #64748b; font-size: 11px; margin-top: 32px; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <header>
    <div class="brand">HỆ THỐNG GIÁO DỤC FPT</div>
    <div>Trung tâm đào tạo công nghệ</div>
    <div class="code">${escapeHtml(document.title)} · ${escapeHtml(document.documentCode)}</div>
  </header>
  <h2>${escapeHtml(document.title)}</h2>
  <table>
    ${visibleRows.map(([label, value]) => `<tr${label === "Thành tiền" ? ' class="total"' : ""}><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}
  </table>
  <footer>Chứng từ phục vụ tra cứu và lưu trữ nội bộ. Ngày in: ${escapeHtml(new Date().toLocaleDateString("vi-VN"))}</footer>
</body>
</html>`;
};

export const printFinancialDocument = (document: FinancialDocumentDetails) =>
  Print.printAsync({ html: financialDocumentHtml(document) });
