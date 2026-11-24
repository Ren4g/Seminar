/**
 * @file main.tsx
 * @description Điểm khởi động (Entry point) chính của ứng dụng web: Tải CSS và điều hướng giữa phân hệ Quản trị (AdminApp) và Khách tham quan (VisitorApp).
 * @screen Khởi tạo toàn bộ ứng dụng.
 * @activityDiagram Khởi động hệ thống -> Điều hướng theo URL (`/admin` hoặc `/visitor` hoặc `/`).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Phân luồng URL admin: Biến điều kiện `window.location.pathname.startsWith('/admin')`.
 */

import { createRoot, type Root } from 'react-dom/client';
import { AdminApp } from './pages/admin/AdminApp';
import { VisitorApp } from './pages/visitor/VisitorApp';
import './styles.css';

// [TÍNH NĂNG: Khởi tạo React Root và kết nối phần tử DOM #root]
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Application root element was not found');
}

const runtime = globalThis as typeof globalThis & { __audioGuideRoot?: Root };
const root = runtime.__audioGuideRoot ?? createRoot(rootElement);
runtime.__audioGuideRoot = root;

// [TÍNH NĂNG: Phân luồng ứng dụng dựa trên URL: /admin -> AdminApp, còn lại -> VisitorApp]
root.render(
  window.location.pathname.startsWith('/admin') ? <AdminApp /> : <VisitorApp />
);
