/**
 * @file languages.ts
 * @description Danh sách ngôn ngữ gợi ý cấu hình và dữ liệu mẫu khởi tạo.
 * @screen Màn hình Admin (Tab "Ngôn ngữ & giọng đọc") và trạng thái khởi tạo Content Studio.
 * @activityDiagram Thiết lập ngôn ngữ hệ thống -> Tạo giọng đọc ElevenLabs.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Thêm một ngôn ngữ mới vào hệ thống: Thêm 1 object vào mảng `PRESET_LANGUAGES` bên dưới.
 *  - Thay đổi voice ElevenLabs mặc định cho một ngôn ngữ: Sửa giá trị `defaultVoice` tương ứng.
 */

import type { ContentItem } from '../types/content';

// ==================== CẤU HÌNH NGÔN NGỮ (PRESET LANGUAGES) ====================
// [TÍNH NĂNG: Danh sách ngôn ngữ gợi ý & ElevenLabs Voice ID mặc định]
export const PRESET_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', defaultVoice: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'en', name: 'English', defaultVoice: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'ja', name: 'Tiếng Nhật (Japanese)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'ko', name: 'Tiếng Hàn (Korean)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'zh', name: 'Tiếng Trung (Chinese)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'fr', name: 'Tiếng Pháp (French)', defaultVoice: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'es', name: 'Tiếng Tây Ban Nha (Spanish)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'de', name: 'Tiếng Đức (German)', defaultVoice: 'VR6AewLTigWG4xSOukaG' },
  { code: 'ru', name: 'Tiếng Nga (Russian)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'th', name: 'Tiếng Thái (Thai)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
];

// [TÍNH NĂNG: Dữ liệu mẫu khởi tạo khi chưa tải được API]
export const initialItems: ContentItem[] = [
  { id: 1, title: 'Cổng thành phía Đông', place: 'Khu di tích Hoàng Thành', language: 'VI', status: 'Chờ duyệt', updated: '12 phút trước', duration: '02:34', body: 'Bạn đang đứng trước cổng thành phía Đông, lối vào từng đón những đoàn khách đầu tiên của kinh thành.' },
  { id: 2, title: 'The eastern gate', place: 'Imperial Citadel', language: 'EN', status: 'Cần rà soát', updated: 'Hôm qua', duration: '02:34', body: 'You are standing at the eastern gate, once the first threshold into the imperial citadel.' },
  { id: 3, title: 'Nhà D67', place: 'Khu di tích Hoàng Thành', language: 'VI', status: 'Đã xuất bản', updated: '06 tháng 11', duration: '03:12', body: 'Nhà D67 giữ lại những lớp ký ức rất riêng của một giai đoạn lịch sử nhiều biến động.' },
];
