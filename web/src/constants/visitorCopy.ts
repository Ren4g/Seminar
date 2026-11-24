/**
 * @file visitorCopy.ts
 * @description Toàn bộ văn bản hiển thị tĩnh (copywriting) trên giao diện khách tham quan (Tiếng Việt & Tiếng Anh).
 * @screen Màn hình Visitor (Trang chủ, Chi tiết thuyết minh, Bản đồ, Lịch sử nghe).
 * @activityDiagram Hiển thị giao diện đa ngôn ngữ theo lựa chọn của khách.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi câu slogan, tiêu đề banner, thông báo: Sửa chuỗi tương ứng trong `vi` hoặc `en`.
 *  - Thêm ngôn ngữ giao diện thứ 3: Mở rộng thêm nhánh mới vào object `VISITOR_COPY`.
 */

// ==================== CẤU HÌNH VĂN BẢN GIAO DIỆN KHÁCH ====================
// [TÍNH NĂNG: Văn bản song ngữ cho giao diện Visitor]
export const VISITOR_COPY = {
  vi: {
    discover: 'Khám phá',
    language: 'Ngôn ngữ',
    footer: 'Thuyết minh đa ngôn ngữ, ngay tại điểm đến.',
    heroLine1: 'Mỗi điểm đến,',
    heroLine2: 'một câu chuyện riêng.',
    heroSubtitle: 'Chọn một nơi, nghe những câu chuyện theo ngôn ngữ của bạn.',
    explore: 'Khám phá địa điểm',
    featured: 'Điểm tham quan nổi bật',
    loadingFeatured: 'Đang tải điểm tham quan…',
    featuredEmpty: 'Địa điểm sắp được cập nhật.',
    placesHeading: 'Chọn nơi bạn muốn đến.',
    poiSingular: 'điểm tham quan',
    poiPlural: 'điểm tham quan',
    loadingPlaces: 'Đang tải địa điểm…',
    noPlaces: 'Chưa có địa điểm nào được xuất bản.',
    defaultLocationDescription: 'Khám phá những câu chuyện và điểm tham quan tại đây.',
    placeCount: 'điểm',
    historyHeading: 'Lịch sử nghe trên thiết bị.',
    clearHistory: 'Xóa tất cả lịch sử',
    removeHistory: 'Xóa mục này khỏi lịch sử',
    back: 'Tất cả địa điểm',
    locationPrefix: 'Điểm',
    loadingContent: 'Đang tải thuyết minh…',
    missingContent: 'Chưa có nội dung cho điểm này.',
    chooseOther: 'Chọn một điểm khác',
    noAudio: 'Nội dung này chưa có audio.',
    languageHint: 'Bạn có thể đổi ngôn ngữ ở phía trên để nghe bản dịch tương ứng.',
    fallbackLead: 'Chưa có bản ',
    fallbackMiddle: ', đang hiển thị ',
    fallbackEnd: '.',
    map: 'Bản đồ',
    viewMap: 'Xem trên bản đồ',
    viewList: 'Danh sách địa điểm',
  },
  en: {
    discover: 'Discover',
    language: 'Language',
    footer: 'Multilingual audio stories, right where you are.',
    heroLine1: 'Every destination,',
    heroLine2: 'a story of its own.',
    heroSubtitle: 'Choose a place and hear its stories in your language.',
    explore: 'Explore places',
    featured: 'Featured points of interest',
    loadingFeatured: 'Loading points of interest...',
    featuredEmpty: 'Places will be added soon.',
    placesHeading: 'Choose a place to explore.',
    poiSingular: 'point of interest',
    poiPlural: 'points of interest',
    loadingPlaces: 'Loading places...',
    noPlaces: 'No published places yet.',
    defaultLocationDescription: 'Explore the stories and points of interest here.',
    placeCount: 'points',
    historyHeading: 'Recently played on this device.',
    clearHistory: 'Clear listening history',
    removeHistory: 'Remove this item from history',
    back: 'All places',
    locationPrefix: 'At',
    loadingContent: 'Loading narration...',
    missingContent: 'No narration is available for this place yet.',
    chooseOther: 'Choose another place',
    noAudio: 'Audio is not available for this story yet.',
    languageHint: 'Choose another language above to hear its version of this story.',
    fallbackLead: 'No ',
    fallbackMiddle: ' version is available; showing ',
    fallbackEnd: '.',
    map: 'Map',
    viewMap: 'View on map',
    viewList: 'Places list',
  },
} as const;

export type VisitorCopy = typeof VISITOR_COPY[keyof typeof VISITOR_COPY];
