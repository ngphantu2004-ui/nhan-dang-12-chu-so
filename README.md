C# CCCD OCR

**Thư viện nhận dạng số căn cước công dân (CCCD) 12 chữ số trực tiếp trên trình duyệt.**

Thư viện cung cấp lõi OCR và adapter camera độc lập để tích hợp vào website. Tài nguyên Tesseract được lưu cục bộ; 


## Tính năng

- **Nhận dạng 12 chữ số:** chỉ chấp nhận kết quả khớp định dạng `^\d{12}$`.
- **ROI có cấu hình:** xử lý nội dung trong vùng quét được chỉ định.
- **Ba chế độ tiền xử lý:** `P1`, `P2` và `BOTH`.
- **Voting theo frame:** xác nhận dựa trên cửa sổ phiếu trượt, không đếm mỗi pass thành một phiếu riêng.
- **Dễ tích hợp:** sử dụng `CccdOcrScanner` và các callback `onResult`, `onFrame`, `onError`.
- **Ưu tiên quyền riêng tư:** cấu hình bản xuất tắt telemetry, lưu ảnh, lưu văn bản nhạy cảm và console logging mặc định.

## Cấu hình của bản xuất

| Tham số | Giá trị |
|---|---|
| ROI | `200 × 38 px` |
| Pass | `P2` |
| Chu kỳ bắt frame đã cấu hình | `200 ms` |
| Voting | `4/5` |
| Timeout | `10.000 ms` |
| Thời điểm xuất (UTC) | `2026-10-13T04:46:43+00:00` |

> Đây là **thông số cấu hình**, không phải cam kết mỗi lần nhận dạng hoàn tất trong 200 ms. Tác vụ OCR đang chạy không bị ngắt giữa chừng khi hết timeout.

## Cấu trúc thư mục

```text
cccd-ocr/
├── README.md                    # Tài liệu dành cho GitHub
├── index.html                   # Trang demo camera
├── demo.js                      # Logic giao diện demo
├── cccd-ocr.js                  # Lõi OCR, ROI, Voting, feedback và cấu hình
├── cccd-ocr-scanner.js          # Adapter camera cho website tích hợp
├── HUONG_DAN.md                 # Hướng dẫn có trong gói xuất gốc
└── tesseract/
    ├── tesseract.min.js
    ├── worker.min.js
    ├── eng.traineddata.gz
    └── core/
        ├── tesseract-core.wasm.js
        ├── tesseract-core-simd.wasm.js
        ├── tesseract-core-lstm.wasm.js
        ├── tesseract-core-simd-lstm.wasm.js
        └── *.wasm                # Nếu có trong bản xuất
```

Các tệp thực tế phải được lấy từ gói xuất. Hãy kiểm tra đầy đủ binary WebAssembly mà phiên bản Tesseract đang dùng cần tải trước khi phát hành repository.

## Chạy demo

**1.** Giải nén toàn bộ gói vào một thư mục.

**2.** Phục vụ thư mục bằng một static server. Chọn **một** trong hai cách:

```bash
python -m http.server 8000
```

hoặc:

```bash
php -S localhost:8000
```

**3.** Truy cập [http://localhost:8000/index.html](http://localhost:8000/index.html), chọn **Bắt đầu quét** và cấp quyền camera.

Camera và worker cần ngữ cảnh bảo mật phù hợp: sử dụng **`localhost` hoặc HTTPS**. Mở trực tiếp `file:///.../index.html` không được bảo đảm hoạt động. Khi triển khai thật, có thể dùng Apache, Nginx hoặc một static server khác.

## Tích hợp vào website

Sao chép **nguyên thư mục** `tesseract/` cùng `cccd-ocr.js`, `cccd-ocr-scanner.js` vào thư mục public, ví dụ:

```text
/assets/cccd-ocr/
├── cccd-ocr.js
├── cccd-ocr-scanner.js
└── tesseract/
```

Các URL tài nguyên Tesseract được xác định theo vị trí của `cccd-ocr.js`, **không cố định ở `/tesseract/` tại gốc website**.

### Ví dụ HTML / JavaScript

```html
<div class="camera-box" style="position:relative;width:360px;height:260px;overflow:hidden">
  <video id="cccd-camera" autoplay muted playsinline
         style="width:100%;height:100%;object-fit:cover"></video>
  <div id="cccd-guide" data-cccd-roi
       style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid #16a34a"></div>
</div>

<input id="so-cccd" type="text" aria-label="Số CCCD">
<button id="cccd-start">Quét CCCD</button>

<script src="/assets/cccd-ocr/cccd-ocr.js"></script>
<script src="/assets/cccd-ocr/cccd-ocr-scanner.js"></script>
<script>
  const scanner = CccdOcrScanner.create({
    video: '#cccd-camera',
    guide: '#cccd-guide',

    onResult: (result) => {
      if (result.confirmed && /^\d{12}$/.test(result.cccd)) {
        document.querySelector('#so-cccd').value = result.cccd;
      }
    },

    onFrame: (frame) => {
      // frame.rows: thông số OCR, confidence và latency cho UI riêng.
    },

    onError: (error) => {
      console.error('CCCD OCR failed:', error.code || error.name);
    }
  });

  document.querySelector('#cccd-start').addEventListener('click', () => {
    void scanner.start();
  });

  // Gọi scanner.stop() khi đóng modal hoặc rời màn hình.
</script>
```

Đây là ví dụ tích hợp tối thiểu. **Website nhận tự quyết định giao diện, vị trí điền CCCD, xử lý kết quả và chính sách dữ liệu.** Thư viện không phụ thuộc Controller hoặc Route của Laravel.

### Các API được sử dụng

| API / callback | Mục đích |
|---|---|
| `CccdOcrScanner.create(options)` | Tạo scanner với phần tử video, guide và callback. |
| `scanner.start()` | Bắt đầu phiên quét camera. |
| `scanner.stop()` | Dừng phiên quét. |
| `onResult(result)` | Nhận kết quả xác nhận hoặc kết thúc; `result.cccd` rỗng khi timeout/hủy. |
| `onFrame(frame)` | Đọc các thông số theo frame qua `frame.rows`. |
| `onError(error)` | Xử lý lỗi trong ứng dụng tích hợp. |
| `CccdOcr.onMetrics()` | Nhận thông số OCR từ lõi theo cơ chế callback của thư viện. |

Nếu triển khai tài nguyên Tesseract ở thư mục khác, cấu hình đường dẫn trước khi khởi tạo OCR:

```js
CccdOcr.configure({
  tesseractScriptPath,
  workerPath,
  corePath,
  langPath
});
```

Các biến đường dẫn ở ví dụ trên cần được ứng dụng tích hợp cung cấp theo vị trí triển khai thực tế.

## Quy tắc nhận dạng và Voting

| Chế độ | Quy tắc tạo phiếu |
|---|---|
| `P1` | Đọc ROI/frame bằng P1. |
| `P2` | Đọc ROI/frame bằng P2. |
| `BOTH` | Đọc P1 và P2 trên cùng ROI/frame; chỉ tạo phiếu hợp lệ khi **hai pass trả cùng chuỗi 12 số**. |

- Một ROI/frame tạo **tối đa một phiếu**, kể cả khi dùng `BOTH`.
- Phiếu rỗng vẫn chiếm vị trí trong cửa sổ Voting trượt.
- Bản xuất hiện tại yêu cầu **4 phiếu đồng thuận trong cửa sổ 5 phiếu**.
- `requireBothPasses` được chuẩn hóa theo `passSelection`: `true` với `BOTH`, `false` với `P1` hoặc `P2`.
- Kết quả chỉ được xác nhận khi đáp ứng điều kiện định dạng và Voting.
- Khi timeout hoặc hủy, `onResult.cccd` rỗng. Một lần xử lý OCR đang chạy có thể kết thúc **sau** mốc timeout được cấu hình.

## Quyền riêng tư và dữ liệu

Cấu hình mặc định của **bản xuất**:

```text
telemetry.enabled    = false
save_images          = false
save_sensitive_text  = false
routes               = rỗng
consoleLogging       = false
```

Theo thiết kế được mô tả của bản xuất, ảnh và số CCCD được xử lý tại trình duyệt, **không tự động tải lên máy chủ**. Các chỉ số OCR, độ tin cậy và thời gian vẫn có thể được sử dụng trong bộ nhớ qua `onFrame` hoặc `CccdOcr.onMetrics()`.

**Lưu ý:** Confidence của Tesseract **không phải** xác suất số CCCD được nhận dạng chính xác. Hệ thống tích hợp chịu trách nhiệm về quyền truy cập, truyền/lưu dữ liệu, bảo mật và sự đồng ý phù hợp khi xử lý dữ liệu cá nhân.

## Kiểm tra tính toàn vẹn bản xuất

SHA-256 được cung cấp cho file `cccd-ocr.js` tại thời điểm xuất:

```text
0f979d68d9f77245a42e46e44f345a1a9ea04422b58572b4611985104df80c8d
```

Kiểm tra bằng một trong hai cách:

**Linux / macOS**

```bash
sha256sum cccd-ocr.js
```

**Windows PowerShell**

```powershell
Get-FileHash .\cccd-ocr.js -Algorithm SHA256
```

Hash này áp dụng cho **đúng tệp của bản xuất nêu trên**, không mặc định áp dụng cho các lần chỉnh sửa hoặc phát hành tiếp theo.

## Phụ thuộc và giấy phép

Gói xuất sao chép các tài nguyên OCR từ `public/tesseract/` của hệ thống nguồn. Các dự án liên quan:

- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [tesseract.js-core](https://github.com/naptha/tesseract.js-core)

Khi công bố hoặc phân phối lại repository, cần kiểm tra **phiên bản, giấy phép và thông báo ghi nhận bản quyền** của các tệp Tesseract, dữ liệu ngôn ngữ và các phụ thuộc có trong binary thực tế. Giấy phép của **mã thư viện CCCD OCR tự phát triển** cần được chủ sở hữu xác định riêng; không tự suy ra từ giấy phép Tesseract.

---

**Phạm vi thư viện:** lõi nhận dạng CCCD, ROI, Voting, feedback, cấu hình và adapter camera. Quản lý hồ sơ, lưu trữ CCCD và luồng nghiệp vụ của hệ thống sử dụng **không thuộc trách nhiệm của thư viện**.

