/**
 * @file VisitorDetailHeader.tsx
 * @description Phần tiêu đề của màn hình chi tiết điểm: Ảnh bìa di tích, ghi chú ngôn ngữ fallback, tiêu đề bài thuyết minh và tên khu di tích.
 * @screen Nằm trên cùng của Màn hình chi tiết điểm tham quan (Visitor Detail).
 * @activityDiagram Hiển thị thông tin điểm tham quan và cảnh báo ngôn ngữ thay thế (nếu có).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Cảnh báo hiển thị ngôn ngữ fallback: Thẻ `<p className="visitor-fallback-note">`.
 *  - Ảnh bìa: Thẻ `<div className="visitor-cover">`.
 */

import type { VisitorCopy } from '../../constants/visitorCopy';
import { languageName } from '../../utils/formatters';

type VisitorDetailHeaderProps = {
  locationName: string;
  pointName: string;
  contentTitle: string;
  contentLanguageCode: string;
  language: string;
  fallback: boolean;
  copy: VisitorCopy;
};

// [TÍNH NĂNG: Khung tiêu đề và ảnh bìa chi tiết điểm tham quan]
export function VisitorDetailHeader({
  locationName,
  pointName,
  contentTitle,
  contentLanguageCode,
  language,
  fallback,
  copy,
}: VisitorDetailHeaderProps) {
  const isVi = language.toLowerCase() === 'vi';

  return (
    <>
      <div className="visitor-cover" role="img" aria-label={locationName || pointName} />
      <section className="visitor-detail-content">
        {fallback && (
          <p className="visitor-fallback-note">
            {copy.fallbackLead}
            {languageName(language, isVi ? 'vi' : 'en')}
            {copy.fallbackMiddle}
            {languageName(contentLanguageCode, isVi ? 'vi' : 'en')}
            {copy.fallbackEnd}
          </p>
        )}

        <p className="visitor-kicker">
          {locationName || (isVi ? 'Điểm tham quan' : 'Point of interest')}
        </p>
        <h1>{contentTitle || pointName}</h1>
      </section>
    </>
  );
}
