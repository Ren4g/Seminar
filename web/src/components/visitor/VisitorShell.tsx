/**
 * @file VisitorShell.tsx
 * @description Khung bố cục dùng chung cho phân hệ khách tham quan (Header + Nội dung chính + Footer).
 * @screen Bao bọc toàn bộ các trang của khách tham quan (Trang chủ, Bản đồ, Chi tiết điểm).
 * @activityDiagram Điều hướng và giữ khung hiển thị cố định khi chuyển màn hình.
 */

import type { ReactNode } from 'react';
import type { ApiLanguage } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';
import { VisitorHeader } from './VisitorHeader';
import { VisitorFooter } from './VisitorFooter';

type VisitorShellProps = {
  children: ReactNode;
  viewMode: 'list' | 'map';
  poiId: number | null;
  language: string;
  copy: VisitorCopy;
  availableLanguages: ApiLanguage[];
  poiLanguages: { code: string; name: string; isFallback: boolean; hasVoice: boolean }[];
  onSelectLanguage: (langCode: string) => void;
  onNavigateHome: () => void;
  onNavigateMap: () => void;
};

// [TÍNH NĂNG: Khung bố cục Visitor bao gồm Header và Footer]
export function VisitorShell({
  children,
  viewMode,
  poiId,
  language,
  copy,
  availableLanguages,
  poiLanguages,
  onSelectLanguage,
  onNavigateHome,
  onNavigateMap,
}: VisitorShellProps) {
  return (
    <div className="visitor-page">
      <VisitorHeader
        viewMode={viewMode}
        poiId={poiId}
        language={language}
        copy={copy}
        availableLanguages={availableLanguages}
        poiLanguages={poiLanguages}
        onSelectLanguage={onSelectLanguage}
        onNavigateHome={onNavigateHome}
        onNavigateMap={onNavigateMap}
      />
      {children}
      <VisitorFooter copy={copy} />
    </div>
  );
}
