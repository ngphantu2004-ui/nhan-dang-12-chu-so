# CCCD OCR – Thư viện đóng gói độc lập

**Bản cấu hình khi xuất:** ROI `200 × 38` px; pass `P2`; bắt frame `200` ms; Voting `4/5`; timeout `10000` ms. Thời điểm lưu: `2026-10-13T04:46:43+00:00`.

SHA-256 của `cccd-ocr.js` xuất: `0f979d68d9f77245a42e46e44f345a1a9ea04422b58572b4611985104df80c8d`.

## 1. Nội dung ZIP

```text
index.html                 # Mở để thử camera (qua localhost hoặc HTTPS)
demo.js                    # Giao diện demo đơn giản
cccd-ocr.js                # Lõi OCR, ROI, Voting, feedback, cấu hình chốt
cccd-ocr-scanner.js        # Adapter camera độc lập, API tiện tích hợp
HUONG_DAN.md               # Hướng dẫn này
tesseract/
  tesseract.min.js         # Tesseract.js
  worker.min.js            # Worker
  eng.traineddata.gz       # Dữ liệu ngôn ngữ English
  core/
    tesseract-core.wasm.js
    tesseract-core-simd.wasm.js
    tesseract-core-lstm.wasm.js
    tesseract-core-simd-lstm.wasm.js
    (*.wasm nếu máy chủ có)
```

**Tất cả tài nguyên OCR cần thiết nằm trong ZIP.** Không phải cài Laravel, Python hay CDN trên hệ thống nhận. Không đưa JSONL, ảnh thực tế, API hoặc dữ liệu CCCD của máy chủ xuất vào ZIP. Bản xuất tắt `consoleLogging` và telemetry mặc định.

## 2. Chạy thử ngay

Giải nén ZIP vào một thư mục, sau đó phục vụ thư mục qua **localhost hoặc HTTPS** (điều kiện bảo mật bắt buộc của camera, worker). Ví dụ tại thư mục đã giải nén:

```bash
python -m http.server 8000
```

Mở **`http://localhost:8000/index.html`**, nhấn **Bắt đầu quét**, cho phép camera. Có thể thay Python bằng PHP built-in server, Laragon/Apache/Nginx hay bất kỳ static server nào:

```bash
php -S localhost:8000
```

Trực tiếp mở `file:///.../index.html` không được bảo đảm hoạt động do chính sách trình duyệt với camera và worker. Không có server backend, database hay API bắt buộc.

## 3. Tích hợp vào website bên thứ ba

Chép nguyên các file `cccd-ocr.js`, `cccd-ocr-scanner.js` và **thư mục** `tesseract/` vào cùng một thư mục public, ví dụ `/assets/cccd-ocr/`. Các URL của Tesseract **tự tính theo vị trí của file `cccd-ocr.js`**, không hardcode `/tesseract/` ở gốc website.

Ví dụ HTML của hệ thống nhận:

```html
<div class="camera-box" style="position:relative;width:360px;height:260px;overflow:hidden">
  <video id="cccd-camera" autoplay muted playsinline style="width:100%;height:100%;object-fit:cover"></video>
  <div id="cccd-guide" data-cccd-roi style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid #16a34a"></div>
</div>
<button id="cccd-start">Quét CCCD</button>
<script src="/assets/cccd-ocr/cccd-ocr.js"></script>
<script src="/assets/cccd-ocr/cccd-ocr-scanner.js"></script>
<script>
  const scanner = CccdOcrScanner.create({
    video: '#cccd-camera', guide: '#cccd-guide',
    onResult: (result) => {
      if (result.confirmed && /^\d{12}$/.test(result.cccd)) {
        // Tự nhập CCCD vào biểu mẫu của ứng dụng sau khi Voting xác nhận.
        document.querySelector('#so-cccd').value = result.cccd;
      }
    },
    onFrame: (frame) => {
      // frame.rows: thông số OCR/Confidence/latency cho UI riêng, chỉ trong bộ nhớ.
    },
    onError: (error) => { console.error('CCCD OCR failed:', error.code || error.name); }
  });
  document.querySelector('#cccd-start').addEventListener('click', () => { void scanner.start(); });
  // scanner.stop() dùng khi đóng modal hoặc điều hướng.
</script>
```

Ứng dụng tự tạo giao diện, quyết định nhập CCCD vào đâu, xử lý dữ liệu và quyền riêng tư. Thư viện **không** phụ thuộc Controller/Route Laravel. Nếu chuyển thư mục Tesseract ra vị trí khác, có thể gọi `CccdOcr.configure({tesseractScriptPath, workerPath, corePath, langPath})` trước khi `init()`.

## 4. Cơ chế xác nhận

- **P1:** mỗi frame đọc một lần P1.
- **P2:** mỗi frame đọc một lần P2.
- **BOTH:** cùng ROI/frame đọc P1 và P2; chỉ tạo phiếu khi cả hai cho **cùng chuỗi 12 số**.
- Voting tính **một phiếu cho mỗi ROI/frame**, không tính một phiếu cho mỗi pass. Phiếu rỗng vẫn nằm trong cửa sổ trượt. Chỉ trả CCCD khi đạt ngưỡng quá bán đã cấu hình.
- `requireBothPasses` được chuẩn hóa theo `passSelection`: `true` khi BOTH, `false` khi P1/P2. `onResult.cccd` rỗng khi timeout hoặc hủy.
- Timeout tối đa theo cấu hình OCR; tác vụ đang xử lý không bị cắt giữa chừng nên kết quả có thể chậm hơn thời điểm hết hạn một lượt.

## 5. Cấu hình và dữ liệu

Trong ZIP, `telemetry.enabled=false`, `save_images=false`, `save_sensitive_text=false`, `routes` rỗng và `consoleLogging=false`. Chỉ số thời gian và confidence vẫn có thể dùng qua callback `onFrame` hoặc `CccdOcr.onMetrics()`, nhưng **không tự gửi số CCCD hoặc ảnh đến bất kỳ server nào**.

Ảnh/chữ số là dữ liệu cá nhân; website tích hợp tự chịu trách nhiệm về truy cập, truyền, lưu trữ, bảo mật và sự đồng ý phù hợp. Confidence của Tesseract không phải xác suất CCCD chính xác.

## 6. Tài nguyên bên thứ ba

Gói bao gồm binary và dữ liệu Tesseract **được sao chép từ `public/tesseract/` của máy chủ xuất**. Khi phân phối tiếp, cần giữ các thông báo bản quyền tương ứng theo phiên bản thực tế của Tesseract.js, tesseract.js-core, dữ liệu ngôn ngữ, và các phụ thuộc. Nguồn tham khảo giấy phép/dự án: https://github.com/naptha/tesseract.js ; https://github.com/naptha/tesseract.js-core .
