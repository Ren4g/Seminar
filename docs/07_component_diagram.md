~~## 6. Component Diagram~~
**[ĐÃ SỬA 16/11] (loại bỏ vì tài liệu gốc không có, mã D12)** ## 6. Component Diagram
*(Ghi chú: Tài liệu gốc `dac_ta_use_case_hoan_chinh_v2.docx` chỉ là đặc tả Use Case nghiệp vụ, không quy định mô hình phân rã thành phần hệ thống Component Diagram. Sơ đồ này được giữ lại dưới dạng đề xuất kiến trúc kỹ thuật tham khảo).*

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
      AdminUI["Admin Web UI"]
      VisitorUI["Visitor Web (Responsive)"]
      Local["Browser Local Storage"]
    end

    subgraph Backend["Application / Backend"]
      Auth["Authentication and Authorization"]
      Account["Account and Assignment Service"]
      Catalog["Location and POI Service"]
      Content["Narration Content and Version Service"]
      Workflow["Review / Publish Workflow"]
      Translation["Translation Orchestration"]
      Audio["Audio / TTS Orchestration"]
      QR["QR Code Service"]
      Analytics["Analytics: ghi nhận sự kiện ẩn danh và tổng hợp"]
    end

    subgraph Data["Data Layer"]
      RDB["Relational Database"]
      Files["Audio / QR File Storage"]
      Events["Activity Event Store"]
    end

    subgraph External["External Services"]
      MT["Translation Provider API"]
      TTS["TTS Provider API"]
    end

    AdminUI --> Auth
    AdminUI --> Account
    AdminUI --> Catalog
    AdminUI --> Content
    AdminUI --> Workflow
    AdminUI --> Translation
    AdminUI --> Audio
    AdminUI --> QR
    AdminUI --> Analytics
    VisitorUI --> Catalog
    VisitorUI --> Content
    VisitorUI --> QR
    VisitorUI --> Analytics
    VisitorUI <--> Local
    Auth --> RDB
    Account --> RDB
    Catalog --> RDB
    Content --> RDB
    Workflow --> Content
    Translation --> Content
    Audio --> Content
    Audio --> Files
    QR --> Catalog
    QR --> Files
    Analytics --> Events
    Analytics --> Catalog
    Translation --> MT
    Audio --> TTS
```

> Đây là **component decomposition đề xuất** từ trách nhiệm nghiệp vụ, không phải cấu trúc code/framework đã được đặc tả. Mọi ghi nhận sự kiện của Visitor đi qua Backend (Analytics), không ghi thẳng vào tầng dữ liệu. Có thể triển khai các service này thành module trong một modular monolith; không có căn cứ bắt buộc phải tách microservices. Kiểm tra quyền (Auth) áp dụng cho mọi lời gọi quản trị.

