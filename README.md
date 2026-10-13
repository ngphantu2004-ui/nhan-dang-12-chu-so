CCCD OCR – Thư viện Đóng gói Độc lập (Client-Side)Thư viện quét và nhận dạng số Căn cước công dân (CCCD) Việt Nam chạy 100% Client-Side trên trình duyệt web, không cần Backend API hay cơ sở dữ liệu.📌 Thông tin Cấu hình & Bản xuấtThông sốGiá trị cấu hìnhKích thước ROI200 × 38 pxPass ModeP2Tần suất bắt Frame200 msThuật toán Voting4/5 (Yêu cầu 4/5 phiếu trùng khớp trong cửa sổ trượt)Timeout10000 ms (10 giây)Thời điểm lưu2026-10-13T04:46:43+00:00SHA-256 (cccd-ocr.js)0f979d68d9f77245a42e46e44f345a1a9ea04422b58572b4611985104df80c8d📦 1. Cấu trúc Tập tin ZIPGói ZIP đã bao gồm đầy đủ tài nguyên OCROffline. Không cần cài đặt Laravel, Python, Node.js hay phụ thuộc CDN bên ngoài.Plaintext├── index.html                  # Mở để chạy thử camera (qua localhost hoặc HTTPS)
├── demo.js                     # Giao diện demo đơn giản
├── cccd-ocr.js                 # Lõi OCR: ROI, Voting, Feedback, Cấu hình chốt
├── cccd-ocr-scanner.js         # Adapter camera độc lập, API tiện tích hợp
├── HUONG_DAN.md                # Hướng dẫn chi tiết
└── tesseract/                  # Bộ tài nguyên Tesseract offline
    ├── tesseract.min.js        # Core library
    ├── worker.min.js           # Web Worker
    ├── eng.traineddata.gz      # Dữ liệu ngôn ngữ tiếng Anh
    └── core/                   # Các file WebAssembly (*.wasm)
        ├── tesseract-core.wasm.js
        ├── tesseract-core-simd.wasm.js
        ├── tesseract-core-lstm.wasm.js
        └── tesseract-core-simd-lstm.wasm.js
Lưu ý Bảo mật & Bắt buộc:Không chứa file JSONL, ảnh thực tế, API key hay dữ liệu CCCD riêng tư.Mặc định bản xuất đã tắt consoleLogging và telemetry.🚀 2. Chạy thử nhanh (Quick Start)Giải nén file ZIP vào một thư mục, sau đó khởi chạy Web Server nội bộ (bắt buộc chạy trên localhost hoặc giao thức HTTPS theo chính sách bảo mật trình duyệt đối với Camera & Web Worker).Dùng Python 3:Bashpython -m http.server 8000
Dùng PHP Built-in Server:Bashphp -S localhost:8000
Mở trình duyệt truy cập: http://localhost:8000/index.html ➔ Nhấn Bắt đầu quét ➔ Cho phép truy cập Camera.⚠️ Cảnh báo: Trực tiếp mở file dạng file:///.../index.html sẽ không hoạt động do rào cản CORS và bảo mật Web Worker của trình duyệt.🛠️ 3. Hướng dẫn Tích hợp vào WebsiteSao chép thư mục tesseract/, file cccd-ocr.js và cccd-ocr-scanner.js vào thư mục static trên máy chủ của bạn (ví dụ: /assets/cccd-ocr/).Các đường dẫn của Tesseract được tự động tính toán theo vị trí của cccd-ocr.js, không bắt buộc hardcode tại gốc website.HTML<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Tích hợp Quét CCCD OCR</title>
</head>
<body>

    <!-- Giao diện tùy chỉnh của ứng dụng -->
    <div class="ocr-wrapper">
        <video id="cccd-camera" autoplay playsinline></video>
        <div id="cccd-guide"></div>
        <button id="cccd-start">Quét CCCD</button>
        
        <input type="text" id="so-cccd" placeholder="Số CCCD sẽ tự điền..." readonly />
    </div>

    <!-- Nhúng thư viện OCR -->
    <script src="/assets/cccd-ocr/cccd-ocr.js"></script>
    <script src="/assets/cccd-ocr/cccd-ocr-scanner.js"></script>

    <script>
        const scanner = CccdOcrScanner.create({
            video: '#cccd-camera',
            guide: '#cccd-guide',
            onResult: (result) => {
                // Kiểm tra kết quả xác nhận và khớp đúng 12 chữ số
                if (result.confirmed && /^\d{12}$/.test(result.cccd)) {
                    document.querySelector('#so-cccd').value = result.cccd;
                }
            },
            onFrame: (frame) => {
                // Nhận thông số OCR/Confidence/Latency theo thời gian thực để render UI (chỉ lưu trong RAM)
            },
            onError: (error) => {
                console.error('CCCD OCR Lỗi:', error.code || error.name);
            }
        });

        // Kích hoạt quét
        document.querySelector('#cccd-start').addEventListener('click', () => {
            void scanner.start();
        });

        // Dùng scanner.stop() để tắt camera khi đóng Modal hoặc chuyển trang
    </script>
</body>
</html>
Cấu hình đường dẫn Tesseract tùy chỉnhNếu chuyển thư mục tesseract/ ra vị trí khác với cấu trúc mặc định, gọi hàm cấu hình trước khi khởi tạo:JavaScriptCccdOcr.configure({
    tesseractScriptPath: '/custom-path/tesseract.min.js',
    workerPath: '/custom-path/worker.min.js',
    corePath: '/custom-path/core/',
    langPath: '/custom-path/'
});
⚙️ 4. Cơ chế Xác nhận & Đọc Dữ liệu (Voting System)Chế độ Pass:P1 / P2: Đọc 1 lần theo thuật toán cấu hình cho mỗi frame.BOTH: Nhận dạng đồng thời cả P1 và P2 trên cùng ROI. Chỉ tạo 1 phiếu bầu khi cả hai phương pháp đều cho ra cùng chuỗi 12 chữ số.Cơ chế Voting:Thuật toán tính 1 phiếu bầu cho mỗi ROI/Frame.Cửa sổ trượt (sliding window) chứa cả các phiếu rỗng (không đọc được số).Chỉ trả về kết quả số CCCD hoàn chỉnh (result.confirmed = true) khi đạt ngưỡng quá bán đã thiết lập (Voting 4/5).requireBothPasses tự động chuẩn hóa: true khi dùng chế độ BOTH, false khi dùng P1 hoặc P2.Timeout & Tác vụ:onResult.cccd sẽ trả về rỗng nếu hết thời gian (10000 ms) hoặc người dùng hủy tác vụ.Tác vụ OCR đang chạy dở sẽ không bị ngắt đột ngột, do đó kết quả thực tế có thể trễ hơn thời điểm timeout một vài milisecond.🔒 5. Bảo mật & Quyền Quyền riêng tưCấu hình mặc định trong gói:JavaScripttelemetry.enabled = false;
save_images = false;
save_sensitive_text = false;
consoleLogging = false;
routes = [];
Chỉ số hiệu năng: Các chỉ số về độ trễ và độ tin cậy (confidence) chỉ truyền qua callback onFrame hoặc CccdOcr.onMetrics() để phục vụ hiển thị UI. Thư viện không tự động truyền/gửi số CCCD hay hình ảnh về bất kỳ máy chủ nào.Trách nhiệm pháp lý: Số CCCD và ảnh chụp là dữ liệu cá nhân nhạy cảm. Đơn vị tích hợp tự chịu trách nhiệm về việc xin quyền truy cập camera, truyền tải, bảo mật và lưu trữ tuân thủ các quy định pháp luật hiện hành.📄 6. Tài nguyên Bên thứ ba & Giấy phépGói phân phối bao gồm các tập tin Binary và dữ liệu của Tesseract.js được sao chép từ dự án gốc. Khi tái phân phối, vui lòng giữ nguyên các thông báo bản quyền đi kèm.Tesseract.js GitHub RepositoryTesseract.js Core GitHub Repository
