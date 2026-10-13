(function (global) {
    'use strict';
    const cccdLibraryUrl = global.document && global.document.currentScript && global.document.currentScript.src
        ? global.document.currentScript.src : (global.document ? global.document.baseURI : global.location.href);
    const cccdAssetsUrl = new URL('tesseract/', new URL('.', cccdLibraryUrl)).href;
    const DEFAULT_CONFIG = {
        tesseractScriptPath: new URL('tesseract.min.js', cccdAssetsUrl).href,
        workerPath: new URL('worker.min.js', cccdAssetsUrl).href,
        corePath: new URL('core/', cccdAssetsUrl).href.replace(/\/$/, ''),
        langPath: cccdAssetsUrl.replace(/\/$/, ''),
        language: 'eng',
        oem: 1,
        dpi: '300',
        targetWidth: 1800,
        maxPixels: 2200000,
        consoleLogging: false,
        passSelection: 'BOTH', // P1 | P2 | BOTH
        frameIntervalMs: 0, // Khoảng tối thiểu giữa lần bắt đầu lấy 2 frame (0 = nhanh nhất)
        runMode: 'TESTER', // TESTER = tiếp tục thống kê; PRODUCTION = dừng khi đủ vote hoặc timeout
        production: { maxScanMs: 15000 }, // Deadline tổng phiên Production, mặc định 15 giây
        feedback: { noDigitsFrames: 4, minDigitHeightPx: 9, maxDigitHeightRatio: 0.65, flashDurationMs: 700 },
        confirmation: { method: 'CONSENSUS_VOTE', windowSize: 5, minVotes: 3, requireBothPasses: true }
    };
    // Chỉ sửa dữ liệu trong vùng đánh dấu này khi nhấn Lưu ở Index.
    // Không đọc cấu hình từ API/JSON ngoài; đây là nguồn cấu hình duy nhất.
    const CCCD_OCR_SETTINGS = /* CCCD_OCR_CONFIG_BEGIN */
    {
        "schema_version": 7,
        "roi": {
            "width_px": 200,
            "height_px": 38
        },
        "ocr": {
            "pass_selection": "P2",
            "frame_interval_ms": 200,
            "run_mode": "PRODUCTION",
            "production": {
                "max_scan_ms": 10000
            },
            "feedback": {
                "no_digits_frames": 5,
                "min_digit_height_px": 9,
                "max_digit_height_ratio": 0.65,
                "flash_duration_ms": 700
            },
            "target_width": 1800,
            "max_pixels": 2200000,
            "confirmation": {
                "method": "CONSENSUS_VOTE",
                "window_size": 5,
                "min_votes": 4,
                "require_both_passes": false
            }
        },
        "telemetry": {
            "enabled": false,
            "save_images": false,
            "save_sensitive_text": false,
            "routes": {
                "log": "",
                "sessions": "",
                "session": "",
                "image": ""
            }
        },
        "updated_at": "2026-10-13T04:46:43+00:00",
        "ui": {
            "roi": {
                "visible": true,
                "position": {
                    "relative_to": "stage",
                    "anchor": "center",
                    "x_percent": 0,
                    "y_percent": 0,
                    "x_px": 0,
                    "y_px": 0
                },
                "border_color": "#e2fce8",
                "border_width_px": 2,
                "border_radius_px": 6
            },
            "feedback": {
                "enabled": true,
                "show": {
                    "guidance": false,
                    "first_vote": true,
                    "progress": true,
                    "confirmed": false,
                    "timeout": true
                },
                "position": {
                    "relative_to": "stage",
                    "anchor": "bottom-center",
                    "x_percent": 0,
                    "y_percent": 0,
                    "x_px": 0,
                    "y_px": -12
                },
                "background_color": "rgba(15,23,42,0.89)",
                "text_color": "#ffffff",
                "font_size_px": 12,
                "duration_ms": {
                    "guidance": 3300,
                    "first_vote": 1800,
                    "progress": 2800,
                    "confirmed": 5500,
                    "timeout": 1800
                },
                "flash": {
                    "first_vote": true,
                    "confirmed": true
                },
                "text": {
                    "guidance": "Hãy đưa 12 số vào khung.",
                    "guidance_center": "Hãy đưa đủ 12 chữ số vào giữa khung và giữ máy ổn định.",
                    "guidance_closer": "Hãy đưa dãy số lại gần camera một chút.",
                    "guidance_farther": "Hãy đưa dãy số ra xa camera một chút.",
                    "first_vote": "Đã đọc được dãy số (1/{min_votes}). Hãy giữ yên máy.",
                    "progress": "Đang kiểm tra: đã khớp {votes}/{min_votes} lần. Hãy giữ yên máy.",
                    "confirmed": "Đã kiểm tra xong! Số CCCD đã được xác nhận.",
                    "timeout": "Chưa đọc được số CCCD. Hãy điều chỉnh máy và thử lại."
                }
            },
            "blocks": {
                "guide_label": {
                    "visible": false,
                    "position": {
                        "relative_to": "roi",
                        "anchor": "top-center",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": 0,
                        "y_px": -8
                    }
                },
                "metrics": {
                    "visible": true,
                    "position": {
                        "relative_to": "stage",
                        "anchor": "bottom-center",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": 0,
                        "y_px": -8
                    }
                },
                "result": {
                    "visible": true,
                    "position": {
                        "relative_to": "stage",
                        "anchor": "top-center",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": 0,
                        "y_px": 8
                    }
                },
                "hint": {
                    "visible": true,
                    "position": {
                        "relative_to": "roi",
                        "anchor": "top-center",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": 0,
                        "y_px": -35
                    }
                },
                "status": {
                    "visible": true,
                    "position": {
                        "relative_to": "stage",
                        "anchor": "top-right",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": -9,
                        "y_px": 9
                    }
                },
                "controls": {
                    "visible": false,
                    "position": {
                        "relative_to": "stage",
                        "anchor": "bottom-right",
                        "x_percent": 0,
                        "y_percent": 0,
                        "x_px": -9,
                        "y_px": -9
                    }
                }
            }
        }
    }
    /* CCCD_OCR_CONFIG_END */;
    let currentSettings = JSON.parse(JSON.stringify(CCCD_OCR_SETTINGS));
    function getStoredSettings() { return JSON.parse(JSON.stringify(currentSettings)); }
    function getTelemetry() { return getStoredSettings().telemetry; }
    // Tất cả vị trí UI chỉ ảnh hưởng DOM, không thay đổi ảnh ROI hoặc Voting.
    // Website khác đánh dấu các khối tự tạo bằng data-cccd-ocr-block="guide_label|hint|metrics|result|status|controls".
    const UI_BLOCK_NAMES = ['guide_label', 'hint', 'metrics', 'result', 'status', 'controls'];
    const UI_MESSAGE_NAMES = ['guidance', 'first_vote', 'progress', 'confirmed', 'timeout'];
    const UI_ANCHORS = [
        'top-left','top-center','top-right','center-left','center','center-right',
        'bottom-left','bottom-center','bottom-right'
    ];
    let uiSettings = JSON.parse(JSON.stringify(CCCD_OCR_SETTINGS.ui));
    const uiBoundGuides = new Set();
    function uiClone(value) { return JSON.parse(JSON.stringify(value)); }
    function uiBool(value, label) {
        if (typeof value !== 'boolean') throw new CccdOcrError('INVALID_UI_CONFIG', label + ' phải là true/false.');
        return value;
    }
    function uiNumber(value, low, high, label, integer) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < low || n > high || (integer && !Number.isInteger(n))) {
            throw new CccdOcrError('INVALID_UI_CONFIG', label + ' ngoài giới hạn.');
        }
        return n;
    }
    function uiColor(value, label) {
        // Chỉ nhận mã màu đơn giản; không cho phép chèn CSS/url() từ cấu hình.
        const s = String(value || '').trim();
        if (!/^(?:#[0-9a-fA-F]{3,8}|rgba?\([0-9.,\s%]+\)|transparent)$/.test(s)) {
            throw new CccdOcrError('INVALID_UI_CONFIG', label + ' không phải màu CSS hợp lệ.');
        }
        return s;
    }
    function uiPosition(data, label) {
        const p = data || {};
        const relative = String(p.relative_to || 'stage');
        const anchor = String(p.anchor || 'center');
        if (!['stage', 'roi'].includes(relative) || !UI_ANCHORS.includes(anchor)) {
            throw new CccdOcrError('INVALID_UI_CONFIG', label + ' có điểm neo không hợp lệ.');
        }
        return {
            relative_to: relative, anchor: anchor,
            x_percent: uiNumber(p.x_percent === undefined ? 0 : p.x_percent, -200, 200, label + '.x_percent'),
            y_percent: uiNumber(p.y_percent === undefined ? 0 : p.y_percent, -200, 200, label + '.y_percent'),
            x_px: uiNumber(p.x_px === undefined ? 0 : p.x_px, -5000, 5000, label + '.x_px'),
            y_px: uiNumber(p.y_px === undefined ? 0 : p.y_px, -5000, 5000, label + '.y_px')
        };
    }
    function normalizeUiSettings(input) {
        const defaults = CCCD_OCR_SETTINGS.ui;
        const u = input === undefined || input === null ? defaults : input;
        if (!u || typeof u !== 'object' || Array.isArray(u)) {
            throw new CccdOcrError('INVALID_UI_CONFIG', 'ui phải là object.');
        }
        const r = Object.assign({}, defaults.roi, u.roi || {});
        const f = Object.assign({}, defaults.feedback, u.feedback || {});
        const blocks = Object.assign({}, defaults.blocks, u.blocks || {});
        const result = {
            roi: {
                visible: uiBool(r.visible, 'ui.roi.visible'),
                position: uiPosition(r.position, 'ui.roi.position'),
                border_color: uiColor(r.border_color, 'ui.roi.border_color'),
                border_width_px: uiNumber(r.border_width_px, 0, 20, 'ui.roi.border_width_px'),
                border_radius_px: uiNumber(r.border_radius_px, 0, 100, 'ui.roi.border_radius_px')
            },
            feedback: {
                enabled: uiBool(f.enabled, 'ui.feedback.enabled'),
                position: uiPosition(f.position, 'ui.feedback.position'),
                background_color: uiColor(f.background_color, 'ui.feedback.background_color'),
                text_color: uiColor(f.text_color, 'ui.feedback.text_color'),
                font_size_px: uiNumber(f.font_size_px, 8, 36, 'ui.feedback.font_size_px'),
                show: {}, duration_ms: {}, flash: {}, text: {}
            },
            blocks: {}
        };
        UI_MESSAGE_NAMES.forEach(function (type) {
            const show = Object.assign({}, defaults.feedback.show, f.show || {});
            const durations = Object.assign({}, defaults.feedback.duration_ms, f.duration_ms || {});
            const texts = Object.assign({}, defaults.feedback.text, f.text || {});
            result.feedback.show[type] = uiBool(show[type], 'ui.feedback.show.' + type);
            result.feedback.duration_ms[type] = uiNumber(durations[type], 0, 30000,
                'ui.feedback.duration_ms.' + type, true);
            if (typeof texts[type] !== 'string' || texts[type].length > 250) {
                throw new CccdOcrError('INVALID_UI_CONFIG', 'ui.feedback.text.' + type + ' không hợp lệ.');
            }
            result.feedback.text[type] = texts[type];
        });
        ['guidance_center','guidance_closer','guidance_farther'].forEach(function (type) {
            const text = (f.text || {})[type] === undefined ? defaults.feedback.text[type] : f.text[type];
            if (typeof text !== 'string' || text.length > 250) {
                throw new CccdOcrError('INVALID_UI_CONFIG', 'ui.feedback.text.' + type + ' không hợp lệ.');
            }
            result.feedback.text[type] = text;
        });
        ['first_vote','confirmed'].forEach(function (type) {
            const flags = Object.assign({}, defaults.feedback.flash, f.flash || {});
            result.feedback.flash[type] = uiBool(flags[type], 'ui.feedback.flash.' + type);
        });
        UI_BLOCK_NAMES.forEach(function (name) {
            const block = Object.assign({}, defaults.blocks[name], blocks[name] || {});
            result.blocks[name] = {
                visible: uiBool(block.visible, 'ui.blocks.' + name + '.visible'),
                position: uiPosition(block.position, 'ui.blocks.' + name + '.position')
            };
        });
        // ROI phải được neo theo khung stage, không thể lấy ROI làm mốc cho chính nó.
        if (result.roi.position.relative_to !== 'stage') {
            throw new CccdOcrError('INVALID_UI_CONFIG', 'ui.roi.position.relative_to phải là stage.');
        }
        return result;
    }
    function getUiSettings() { return uiClone(uiSettings); }
    function setUiSettings(value) {
        uiSettings = normalizeUiSettings(value);
        currentSettings.ui = getUiSettings();
        applyUiLayout();
        return getUiSettings();
    }
    function uiAnchorPoint(anchor) {
        const pair = anchor === 'center' ? ['center','center'] : anchor.split('-');
        const vertical = pair[0], horizontal = pair[1];
        const fx = horizontal === 'left' ? 0 : horizontal === 'right' ? 1 : 0.5;
        const fy = vertical === 'top' ? 0 : vertical === 'bottom' ? 1 : 0.5;
        return {fx:fx, fy:fy};
    }
    function uiStage(guide) { return guide && guide.parentElement; }
    function uiPlace(node, position, stage, guide) {
        if (!node || !node.style || !stage) return;
        const target = position.relative_to === 'roi' && guide ? guide : stage;
        const sr = stage.getBoundingClientRect(), tr = target.getBoundingClientRect();
        if (!sr.width || !sr.height || !tr.width || !tr.height) return;
        const parent = node.offsetParent;
        const origin = parent && (parent === stage || stage.contains(parent))
            ? parent.getBoundingClientRect() : sr;
        const a = uiAnchorPoint(position.anchor);
        const x = tr.left - origin.left + tr.width * (a.fx + position.x_percent / 100) + position.x_px;
        const y = tr.top - origin.top + tr.height * (a.fy + position.y_percent / 100) + position.y_px;
        Object.assign(node.style, {
            position: 'absolute', left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto',
            transform: 'translate(' + (-a.fx * 100) + '%, ' + (-a.fy * 100) + '%)'
        });
    }
    function uiEnsureStage(stage) {
        if (stage && global.getComputedStyle && global.getComputedStyle(stage).position === 'static') {
            stage.style.position = 'relative';
        }
    }
    function uiApplyGuide(guide) {
        const stage = uiStage(guide);
        if (!stage) return;
        uiEnsureStage(stage);
        const r = uiSettings.roi;
        guide.style.visibility = r.visible ? '' : 'hidden';
        guide.style.borderStyle = 'solid';
        guide.style.borderWidth = r.border_width_px + 'px';
        guide.style.borderRadius = r.border_radius_px + 'px';
        guide.style.borderColor = r.border_color;
        // ROI đổi kích thước trước, rồi mới xác định vị trí label/feedback theo khung.
        uiPlace(guide, r.position, stage, null);
    }
    function applyUiLayout(stageElement) {
        if (!global.document) return;
        const scope = stageElement ? resolveElement(stageElement) : global.document;
        if (!scope) return;
        const guides = scope.matches && scope.matches('[data-cccd-roi]') ? [scope] :
            Array.from(scope.querySelectorAll('[data-cccd-roi]'));
        guides.forEach(function (guide) {
            uiApplyGuide(guide);
            const stage = uiStage(guide);
            UI_BLOCK_NAMES.forEach(function (name) {
                const block = stage.querySelector('[data-cccd-ocr-block="' + name + '"]') ||
                    (name === 'guide_label' ? guide.querySelector('.scan-guide-label') : null);
                if (!block) return;
                const options = uiSettings.blocks[name];
                block.style.display = options.visible ? '' : 'none';
                if (options.visible) uiPlace(block, options.position, stage, guide);
            });
            const entry = feedbackBindings.get(guide);
            if (entry && entry.note && entry.note.parentElement === stage) {
                const config = uiSettings.feedback;
                Object.assign(entry.note.style, {
                    background: config.background_color, color: config.text_color,
                    fontSize: config.font_size_px + 'px'
                });
                uiPlace(entry.note, config.position, stage, guide);
                if (!config.enabled || entry.note.dataset.cccdFeedbackHidden === '1') {
                    entry.note.style.display = 'none';
                }
            }
        });
    }
    function uiMessage(type, values) {
        const template = uiSettings.feedback.text[type] || '';
        return template.replace(/\{(votes|min_votes)\}/g, function (_, token) {
            return values && values[token] !== undefined ? String(values[token]) : '';
        });
    }

    function applyStoredSettings(value) {
        if (!value || !value.roi || !value.ocr || !value.telemetry) {
            throw new CccdOcrError('INVALID_CONFIG', 'Thiếu cấu hình OCR/telemetry.');
        }
        const o = value.ocr;
        const roi = normalizeRoiSize(value.roi);
        // Các tham số tiền xử lý được cập nhật an toàn, không tái khởi tạo Tesseract.
        const width = Number(o.target_width), pixels = Number(o.max_pixels);
        if (!Number.isSafeInteger(width) || width < 100 || width > 4000 ||
            !Number.isSafeInteger(pixels) || pixels < 100000 || pixels > 16000000) {
            throw new CccdOcrError('INVALID_CONFIG','Thông số resize OCR không hợp lệ.');
        }
        const confirmation = normalizeConfirmation(o.confirmation, o.pass_selection);
        const feedback = normalizeFeedback(o.feedback);
        const mode = normalizeRunMode(o.run_mode);
        const production = normalizeProduction(o.production);
        const selection = normalizePassSelection(o.pass_selection);
        const interval = Number(o.frame_interval_ms);
        if (!Number.isSafeInteger(interval) || interval < 0 || interval > 10000) {
            throw new CccdOcrError('INVALID_CONFIG','Khoảng bắt frame không hợp lệ.');
        }
        const validatedUi = normalizeUiSettings(value.ui);
        // Chỉ commit sau khi validate đủ tham số, tránh cập nhật dở dang.
        config.targetWidth = width;
        config.maxPixels = pixels;
        config.confirmation = confirmation;
        config.feedback = feedback;
        config.runMode = mode;
        config.production = production;
        config.passSelection = selection;
        config.frameIntervalMs = interval;
        configuredRoiSize = roi;
        currentSettings = JSON.parse(JSON.stringify(value));
        currentSettings.ui = validatedUi;
        uiSettings = validatedUi;
        if (global.document && global.document.readyState !== 'loading') autoApplyRoiToDocument();
        return getStoredSettings();
    }

    // Giữ nguyên đúng 2 pass của phiên bản hiện tại.
    const DEFAULT_PASSES = [
        { psm: '7', mode: 0, cropY: 0.00, cropH: 1.00, label: 'Đọc dòng số' },
        { psm: '7', mode: 1, cropY: 0.06, cropH: 0.88, label: 'Đọc tương phản' }
    ];
    let config = Object.assign({}, DEFAULT_CONFIG, {
        targetWidth: CCCD_OCR_SETTINGS.ocr.target_width,
        maxPixels: CCCD_OCR_SETTINGS.ocr.max_pixels,
        passSelection: CCCD_OCR_SETTINGS.ocr.pass_selection,
        frameIntervalMs: CCCD_OCR_SETTINGS.ocr.frame_interval_ms,
        runMode: CCCD_OCR_SETTINGS.ocr.run_mode,
        production: {maxScanMs: CCCD_OCR_SETTINGS.ocr.production.max_scan_ms},
        feedback: {
            noDigitsFrames: CCCD_OCR_SETTINGS.ocr.feedback.no_digits_frames,
            minDigitHeightPx: CCCD_OCR_SETTINGS.ocr.feedback.min_digit_height_px,
            maxDigitHeightRatio: CCCD_OCR_SETTINGS.ocr.feedback.max_digit_height_ratio,
            flashDurationMs: CCCD_OCR_SETTINGS.ocr.feedback.flash_duration_ms
        },
        confirmation: {
            method: CCCD_OCR_SETTINGS.ocr.confirmation.method,
            windowSize: CCCD_OCR_SETTINGS.ocr.confirmation.window_size,
            minVotes: CCCD_OCR_SETTINGS.ocr.confirmation.min_votes,
            requireBothPasses: CCCD_OCR_SETTINGS.ocr.confirmation.require_both_passes
        }
    });
    let worker = null;
    let workerPromise = null;
    let tesseractPromise = null;
    const metricsListeners = [];
    function findDigitHeight(data, processedHeight, croppedHeight) {
        function usableHeight(item) {
            const box = item && (item.bbox || item.boundingBox);
            const h = box && Number(box.y1) - Number(box.y0);
            return Number.isFinite(h) && h > 0 && h <= processedHeight ? h : null;
        }
        let heights = [];
        let method = null;
        if (Array.isArray(data.symbols)) {
            heights = data.symbols.filter(function (item) {
                return /[0-9]/.test(String(item.text || ''));
            }).map(usableHeight).filter(Boolean);
            if (heights.length) method = 'tesseract_symbols';
        }
        if (!heights.length && Array.isArray(data.words)) {
            heights = data.words.filter(function (item) {
                return /[0-9]/.test(String(item.text || ''));
            }).map(usableHeight).filter(Boolean);
            if (heights.length) method = 'tesseract_words';
        }
        if (!heights.length) {
            return { digitHeightProcessedPx: null, digitHeightRoiPx: null,
                digitHeightMethod: 'bbox_unavailable' };
        }
        heights.sort(function (a, b) { return a - b; });
        const m = Math.floor(heights.length / 2);
        const median = heights.length % 2 ? heights[m] : (heights[m - 1] + heights[m]) / 2;
        return {
            digitHeightProcessedPx: Math.round(median * 10) / 10,
            digitHeightRoiPx: Math.round(median * croppedHeight / processedHeight * 10) / 10,
            digitHeightMethod: method
        };
    }
    const metricsState = {
        active: false,
        sessionStartedAt: 0,
        lastAttemptEndedAt: 0,
        attemptCount: 0
    };
    class CccdOcrError extends Error {
        constructor(code, message, details) {
            super(message);
            this.name = 'CccdOcrError';
            this.code = code;
            this.details = details || null;
        }
    }
    function now() {
        return (global.performance && typeof global.performance.now === 'function')
            ? global.performance.now()
            : Date.now();
    }
    function resolutionOf(source) {
        const size = getSourceSize(source);
        if (!size || !size.width || !size.height) return null;
        return Math.round(size.width) + 'x' + Math.round(size.height);
    }
    function setConsoleLogging(enabled) {
        config.consoleLogging = Boolean(enabled);
    }
    function startSession(sessionOptions) {
        metricsState.active = true;
        metricsState.sessionStartedAt = now();
        metricsState.lastAttemptEndedAt = 0;
        metricsState.attemptCount = 0;
        defaultVotingSession = null;
        resetFeedback();
        return getSessionState();
    }
    function ensureSession() {
        if (!metricsState.active) {
            startSession();
        }
    }
    function getSessionState() {
        return {
            sessionStartedAt: metricsState.sessionStartedAt,
            lastAttemptEndedAt: metricsState.lastAttemptEndedAt,
            attemptCount: metricsState.attemptCount
        };
    }
    function onMetrics(listener) {
        if (typeof listener !== 'function') {
            throw new CccdOcrError(
                'INVALID_METRICS_LISTENER',
                'onMetrics yêu cầu một callback function.'
            );
        }
        metricsListeners.push(listener);
        return function unsubscribe() {
            const index = metricsListeners.indexOf(listener);
            if (index >= 0) metricsListeners.splice(index, 1);
        };
    }
    function emitMetrics(metrics) {
        if (config.consoleLogging !== false) {
            console.log('[CCCD OCR]', metrics);
        }
        metricsListeners.slice().forEach(function (listener) {
            try {
                listener(metrics);
            } catch (error) {
                console.warn('CCCD OCR metrics listener error:', error);
            }
        });
    }
    function configure(options) {
        if (worker || workerPromise) {
            throw new CccdOcrError(
                'ALREADY_INITIALIZED',
                'CCCD OCR đã khởi tạo. Hãy configure trước khi gọi init/recognize.'
            );
        }
        config = Object.assign({}, config, options || {});
    }
    function normalizePassSelection(value) {
        const selected = String(value == null ? 'BOTH' : value).toUpperCase();
        if (!['P1','P2','BOTH'].includes(selected)) {
            throw new CccdOcrError('INVALID_PASS_SELECTION', 'Chế độ pass chỉ được P1, P2 hoặc BOTH.');
        }
        return selected;
    }

    function setPassSelection(value) {
        config.passSelection = normalizePassSelection(value);
        return config.passSelection;
    }

    function getPassSelection() { return normalizePassSelection(config.passSelection); }

    function setFrameIntervalMs(value) {
        const n = Number(value);
        if (!Number.isSafeInteger(n) || n < 0 || n > 10000) {
            throw new CccdOcrError('INVALID_FRAME_INTERVAL',
                'Khoảng bắt frame phải là số nguyên 0–10000 ms.');
        }
        config.frameIntervalMs = n;
        return n;
    }
    function getFrameIntervalMs() { return setFrameIntervalMs(config.frameIntervalMs); }

    function getPasses(selection) {
        const mode = normalizePassSelection(selection === undefined ? getPassSelection() : selection);
        return DEFAULT_PASSES.map(function (pass, index) {
            return Object.assign({ index: index + 1 }, pass);
        }).filter(function (pass) { return mode === 'BOTH' || 'P' + pass.index === mode; });
    }
    function normalizeConfirmation(input, selectionOverride) {
        const data = input || {};
        const windowSize = Number(data.windowSize !== undefined ? data.windowSize :
            (data.window_size !== undefined ? data.window_size : 5));
        const minVotes = Number(data.minVotes !== undefined ? data.minVotes :
            (data.min_votes !== undefined ? data.min_votes : 3));
        if (!Number.isInteger(windowSize) || windowSize < 3 || windowSize > 21 ||
            !Number.isInteger(minVotes) || minVotes < 2 || minVotes > windowSize ||
            minVotes <= windowSize / 2) {
            throw new CccdOcrError('INVALID_VOTING',
                'Voting yêu cầu cửa sổ 3–21 lượt và số phiếu quá bán (ít nhất 2).');
        }
        const method = String(data.method || 'CONSENSUS_VOTE').toUpperCase();
        if (method !== 'CONSENSUS_VOTE') {
            throw new CccdOcrError('INVALID_VOTING', 'Chỉ hỗ trợ CONSENSUS_VOTE.');
        }
        return { method: method, windowSize: windowSize, minVotes: minVotes,
            requireBothPasses: normalizePassSelection(selectionOverride === undefined
                ? getPassSelection() : selectionOverride) === 'BOTH' };
    }
    function setConfirmation(value) {
        config.confirmation = normalizeConfirmation(value);
        return getConfirmation();
    }
    function getConfirmation() {
        return Object.assign({}, normalizeConfirmation(config.confirmation));
    }

    function normalizeRunMode(value) {
        const mode = String(value == null ? 'TESTER' : value).trim().toUpperCase();
        if (mode !== 'TESTER' && mode !== 'PRODUCTION') {
            throw new CccdOcrError('INVALID_RUN_MODE', 'Chế độ phải là TESTER hoặc PRODUCTION.');
        }
        return mode;
    }
    function setRunMode(value) { config.runMode = normalizeRunMode(value); return config.runMode; }
    function getRunMode() { return normalizeRunMode(config.runMode); }
    function normalizeProduction(value) {
        const v = value || {};
        const ms = Number(v.maxScanMs !== undefined ? v.maxScanMs :
            (v.max_scan_ms !== undefined ? v.max_scan_ms : 15000));
        if (!Number.isSafeInteger(ms) || ms < 1000 || ms > 120000) {
            throw new CccdOcrError('INVALID_PRODUCTION_TIMEOUT',
                'Timeout PRODUCTION phải từ 1000 đến 120000 ms.');
        }
        return { maxScanMs: ms };
    }
    function setProduction(value) {
        config.production = normalizeProduction(value);
        return getProduction();
    }
    function getProduction() { return Object.assign({}, normalizeProduction(config.production)); }
    function getProductionMaxScanMs() { return getProduction().maxScanMs; }

    function normalizeFeedback(value) {
        const v = value || {};
        const frames = Number(v.noDigitsFrames !== undefined ? v.noDigitsFrames :
            (v.no_digits_frames !== undefined ? v.no_digits_frames : 4));
        const minHeight = Number(v.minDigitHeightPx !== undefined ? v.minDigitHeightPx :
            (v.min_digit_height_px !== undefined ? v.min_digit_height_px : 9));
        const maxRatio = Number(v.maxDigitHeightRatio !== undefined ? v.maxDigitHeightRatio :
            (v.max_digit_height_ratio !== undefined ? v.max_digit_height_ratio : 0.65));
        const flashMs = Number(v.flashDurationMs !== undefined ? v.flashDurationMs :
            (v.flash_duration_ms !== undefined ? v.flash_duration_ms : 700));
        if (!Number.isInteger(frames) || frames < 2 || frames > 30 ||
            !Number.isFinite(minHeight) || minHeight < 2 || minHeight > 80 ||
            !Number.isFinite(maxRatio) || maxRatio < 0.2 || maxRatio > 0.95 ||
            !Number.isInteger(flashMs) || flashMs < 200 || flashMs > 3000) {
            throw new CccdOcrError('INVALID_FEEDBACK', 'Thông số phản hồi khung ROI không hợp lệ.');
        }
        return { noDigitsFrames: frames, minDigitHeightPx: minHeight,
            maxDigitHeightRatio: maxRatio, flashDurationMs: flashMs };
    }
    function setFeedback(value) { config.feedback = normalizeFeedback(value); return getFeedback(); }
    function getFeedback() { return Object.assign({}, normalizeFeedback(config.feedback)); }

    // Phần hiển thị dùng chung; không lệ thuộc ID hay giao diện của Tester.
    // Mỗi app đăng ký element ROI một lần hoặc dùng data-cccd-roi trên element.
    const feedbackBindings = new Map();
    function bindFeedback(element, options) {
        const guide = resolveElement(element);
        if (!guide || !guide.style) throw new CccdOcrError('INVALID_FEEDBACK_ELEMENT', 'Thiếu khung ROI để hiển thị phản hồi.');
        if (feedbackBindings.has(guide)) return function () { unbindFeedback(guide); };
        const opts = options || {};
        let note = resolveElement(opts.messageElement);
        let created = false;
        if (!note && global.document) {
            note = document.createElement('div');
            created = true;
            note.className = 'cccd-ocr-feedback-message';
            note.setAttribute('role', 'status');
            note.setAttribute('aria-live', 'polite');
            // Gắn vào vùng preview, không lấn vào ROI và không cản thao tác kéo ảnh.
            const parent = guide.parentElement;
            if (parent) {
                if (global.getComputedStyle && global.getComputedStyle(parent).position === 'static') {
                    parent.style.position = 'relative';
                }
                Object.assign(note.style, {
                    position: 'absolute', left: '50%', bottom: '12px', transform: 'translateX(-50%)',
                    maxWidth: '95%', padding: '6px 12px', borderRadius: '7px',
                    background: 'rgba(15,23,42,.89)', color: '#fff', textAlign: 'center',
                    fontSize: '12px', lineHeight: '1.35', fontWeight: '600',
                    pointerEvents: 'none', zIndex: '12', display: 'none'
                });
                parent.appendChild(note);
            }
        }
        feedbackBindings.set(guide, { guide: guide, note: note, created: created,
            borderColor: guide.style.borderColor, backgroundColor: guide.style.backgroundColor,
            messageTimer: null, animation: null, state: '' });
        applyUiLayout(guide);
        return function () { unbindFeedback(guide); };
    }
    function unbindFeedback(element) {
        const guide = resolveElement(element), entry = feedbackBindings.get(guide);
        if (!entry) return;
        if (entry.messageTimer) global.clearTimeout(entry.messageTimer);
        if (entry.animation && entry.animation.cancel) entry.animation.cancel();
        entry.guide.style.borderColor = entry.borderColor;
        entry.guide.style.backgroundColor = entry.backgroundColor;
        if (entry.created && entry.note && entry.note.remove) entry.note.remove();
        feedbackBindings.delete(guide);
    }
    function resetFeedback() {
        feedbackBindings.forEach(function (entry) {
            if (entry.messageTimer) global.clearTimeout(entry.messageTimer);
            if (entry.animation && entry.animation.cancel) entry.animation.cancel();
            entry.guide.style.borderColor = uiSettings.roi.border_color;
            entry.guide.style.backgroundColor = entry.backgroundColor;
            entry.state = '';
            if (entry.note) { entry.note.textContent = ''; entry.note.style.display = 'none'; }
        });
    }
    function presentFeedback(event, message) {
        const f = getFeedback();
        const cfg = uiSettings.feedback;
        const type = String(event || '').toLowerCase();
        const key = event === 'FIRST_VOTE' ? 'first_vote' :
            (event === 'CONFIRMED' ? 'confirmed' : type);
        const show = Boolean(cfg.enabled && cfg.show[key]);
        feedbackBindings.forEach(function (entry) {
            if (entry.state === 'CONFIRMED' && event !== 'CONFIRMED') return;
            if (entry.messageTimer) global.clearTimeout(entry.messageTimer);
            if (entry.note) {
                entry.note.textContent = message;
                entry.note.dataset.cccdFeedbackHidden = show ? '0' : '1';
                entry.note.style.display = show ? '' : 'none';
                if (show) {
                    entry.messageTimer = global.setTimeout(function () {
                        if (entry.note && entry.state !== 'CONFIRMED') {
                            entry.note.style.display = 'none';
                        }
                    }, cfg.duration_ms[key]);
                }
            }
            // Tắt khối thông báo KHÔNG làm mất Voting, không bỏ hiệu ứng nếu đã bật riêng.
            if (event === 'FIRST_VOTE' || event === 'CONFIRMED') {
                const color = event === 'CONFIRMED' ? '#16A34A' : '#F59E0B';
                entry.state = event;
                entry.guide.style.borderColor = color;
                if (entry.animation && entry.animation.cancel) entry.animation.cancel();
                if (cfg.flash[key] && entry.guide.animate) {
                    entry.animation = entry.guide.animate([
                        { borderColor: color, backgroundColor: 'transparent', opacity: 1 },
                        { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,.18)', opacity: .65 },
                        { borderColor: color, backgroundColor: 'transparent', opacity: 1 },
                        { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,.18)', opacity: .65 },
                        { borderColor: color, backgroundColor: 'transparent', opacity: 1 }
                    ], { duration: f.flashDurationMs, iterations: 1 });
                }
            }
        });
    }

    // Chỉ đưa gợi ý khi bbox thực sự có cơ sở ước lượng kích thước chữ.
    // Nếu không có bbox, không suy đoán gần/xa từ việc OCR thất bại.
    function guidanceForRows(rows, feedback) {
        const heights = rows.map(function (r) { return Number(r.digitHeightRoiPx); })
            .filter(function (x) { return Number.isFinite(x) && x > 0; });
        const roiH = getRoiSize().heightPx;
        if (heights.length) {
            const h = heights.sort(function (a,b) { return a-b; })[Math.floor(heights.length/2)];
            if (h < feedback.minDigitHeightPx) return uiMessage('guidance_closer');
            if (h > roiH * feedback.maxDigitHeightRatio) return uiMessage('guidance_farther');
        }
        return uiMessage('guidance_center');
    }

    // Bộ xác nhận độc lập với UI: mỗi phiếu là MỘT ROI/frame, không phải một pass OCR.
    // Các lượt không hợp lệ vẫn chiếm một chỗ trong sliding window.
    function createVotingSession(options) {
        const opts = options || {};
        const selection = normalizePassSelection(opts.passSelection || getPassSelection());
        const policy = normalizeConfirmation(opts.confirmation || getConfirmation(), selection);
        const runMode = normalizeRunMode(opts.runMode || getRunMode());
        const maxScanMs = normalizeProduction(opts.production || getProduction()).maxScanMs;
        let scanningStartedAt = null;
        let timedOut = false;
        const feedback = normalizeFeedback(opts.feedback || getFeedback());
        const window = [];
        const supportWindow = [];
        let frameIndex = 0;
        let confirmed = false;
        let confirmedNumber = '';
        let firstConfirmation = null;
        let firstConsensus = null;
        let locked = false;
        let hasFirstBallot = false;
        let missingFrames = 0;
        let lastGuidance = '';
        let lastProgressKey = '';
        let finalResult = null;
        async function scan(source, context) {
            if (runMode === 'PRODUCTION' && finalResult) return finalResult;
            if (locked) throw new CccdOcrError('BUSY_FRAME', 'Phiên Voting đang xử lý ROI trước.');
            locked = true;
            try {
                if (scanningStartedAt === null) scanningStartedAt = now();
                // Không khởi tạo lại đồng hồ khi nạp ROI mới hoặc khi Vote chưa đủ.
                const elapsedBefore = now() - scanningStartedAt;
                if (runMode === 'PRODUCTION' && elapsedBefore >= maxScanMs) {
                    timedOut = true;
                    const timeoutResult = {
                        status: 'TIMEOUT', errorCode: 'TIMEOUT', retryable: true,
                        confirmed: false, cccd: '', shouldStop: true,
                        runMode: runMode, rows: [], frameIndex: frameIndex,
                        elapsedMs: elapsedBefore, maxScanMs: maxScanMs
                    };
                    presentFeedback('TIMEOUT', uiMessage('timeout'));
                    finalResult = timeoutResult;
                    if (context && typeof context.onFrame === 'function') context.onFrame(timeoutResult);
                    return timeoutResult;
                }
                const passes = getPasses(selection);
                const thisFrame = ++frameIndex;
                const rows = [];
                const perPass = {};
                const contextForPass = context || {};
                for (const pass of passes) {
                    let row;
                    const ctx = typeof contextForPass.makeContext === 'function'
                        ? (contextForPass.makeContext(pass, thisFrame) || {}) : contextForPass;
                    try {
                        const result = await recognizeAttempt(source, pass.index - 1, ctx);
                        row = result.metrics;
                    } catch (error) {
                        row = error && error.details && error.details.metrics;
                        if (!row) throw error;
                    }
                    row.frameIndex = thisFrame;
                    row.passSelection = selection;
                    rows.push(row);
                    perPass['P' + pass.index] = row;
                    if (typeof contextForPass.onPass === 'function') contextForPass.onPass(row);
                }
                const first = perPass.P1, second = perPass.P2;
                const candidate12 = selection === 'BOTH'
                    ? ((first && second && first.recognized12 &&
                        first.recognized12 === second.recognized12) ? first.recognized12 : '')
                    : String(rows[0] && rows[0].recognized12 || '');
                const consensus = selection === 'BOTH' && Boolean(candidate12);
                const firstBallot = Boolean(candidate12) && !hasFirstBallot;
                if (firstBallot) hasFirstBallot = true;
                const hasAny12 = rows.some(function (r) { return Boolean(r.accepted); });
                missingFrames = hasAny12 ? 0 : missingFrames + 1;
                const guidance = !confirmed && missingFrames >= feedback.noDigitsFrames
                    ? guidanceForRows(rows, feedback) : '';
                const showGuidance = Boolean(guidance && (guidance !== lastGuidance ||
                    missingFrames % feedback.noDigitsFrames === 0));
                if (!guidance) lastGuidance = '';
                if (showGuidance) lastGuidance = guidance;
                const current = rows[rows.length - 1];
                if (consensus && !firstConsensus) {
                    firstConsensus = { frameIndex: thisFrame, elapsedMs: current.elapsedMs,
                        number: candidate12, confidenceP1: first.confidence, confidenceP2: second.confidence };
                }
                window.push(candidate12 || '');
                supportWindow.push({ candidate: candidate12,
                    confidenceP1: first && first.recognized12 === candidate12 ? first.confidence : null,
                    confidenceP2: second && second.recognized12 === candidate12 ? second.confidence : null });
                if (window.length > policy.windowSize) { window.shift(); supportWindow.shift(); }
                const counts = {};
                window.forEach(function (item) { if (item) counts[item] = (counts[item] || 0) + 1; });
                const winner = Object.keys(counts).sort(function (a,b) { return counts[b] - counts[a]; })[0] || '';
                const votes = winner ? counts[winner] : 0;
                const voteWindowPassed = window.length === policy.windowSize &&
                    votes >= policy.minVotes;
                // Thời hạn Production được tính theo thời gian thực, kể cả thời gian OCR.
                const elapsedScanMs = now() - scanningStartedAt;
                timedOut = runMode === 'PRODUCTION' && elapsedScanMs >= maxScanMs && !confirmed;
                const justConfirmed = !confirmed && voteWindowPassed && !timedOut;
                if (justConfirmed) {
                    confirmed = true;
                    confirmedNumber = winner;
                    // Confidence đến từ ROI gần nhất BỎ PHIẾU CHO winner, không lấy từ phiếu khác.
                    const support = supportWindow.slice().reverse().find(function(x){return x.candidate === winner;});
                    const supportConfidence = support ? (selection === 'P2' ? support.confidenceP2 : support.confidenceP1) : null;
                    firstConfirmation = { frameIndex: thisFrame, elapsedMs: current.elapsedMs,
                        luot: current.luot, pass: current.pass, number: winner,
                        votes: votes, windowSize: policy.windowSize,
                        confidence: supportConfidence,
                        confidenceP1: support ? support.confidenceP1 : null,
                        confidenceP2: support ? support.confidenceP2 : null };
                }
                // Gắn cùng trạng thái frame vào các dòng P1/P2 để ghi JSONL và vẽ biểu đồ.
                rows.forEach(function(row) {
                    row.runMode = runMode;
                    row.productionMaxScanMs = maxScanMs;
                    row.scanTimedOut = timedOut;
                    row.frameFirstBallot = firstBallot;
                    row.noDigitsStreak = missingFrames;
                    row.feedbackHint = showGuidance ? guidance : null;
                    row.frameCandidate12 = candidate12;
                    row.frameConsensus = consensus;
                    row.voteWindowSize = policy.windowSize;
                    row.voteMinVotes = policy.minVotes;
                    row.voteCount = votes;
                    row.voteCandidate12 = winner;
                    row.voteWindowPassed = voteWindowPassed;
                    row.voteConfirmed = justConfirmed;
                    row.voteActive = confirmed;
                    row.confirmed12 = confirmedNumber;
                    row.voteDecision = row === current;
                    row.voteElapsedMs = justConfirmed ? current.elapsedMs : null;
                    row.voteConfidence = justConfirmed && firstConfirmation ? firstConfirmation.confidence : null;
                    row.voteConfidenceP1 = justConfirmed && firstConfirmation ? firstConfirmation.confidenceP1 : null;
                    row.voteConfidenceP2 = justConfirmed && firstConfirmation ? firstConfirmation.confidenceP2 : null;
                });
                const result = { frameIndex: thisFrame, selection: selection, rows: rows,
                    candidate12: candidate12, consensus: consensus, voteCount: votes,
                    voteWindowPassed: voteWindowPassed, voteCandidate: winner,
                    window: window.slice(), justConfirmed: justConfirmed,
                    confirmed: confirmed, cccd: confirmed ? confirmedNumber : '',
                    firstConsensus: firstConsensus, firstConfirmation: firstConfirmation,
                    runMode: runMode, status: timedOut ? 'TIMEOUT' : (confirmed ? 'CONFIRMED' : 'SCANNING'),
                    elapsedMs: elapsedScanMs, maxScanMs: maxScanMs,
                    errorCode: timedOut ? 'TIMEOUT' : null, retryable: timedOut,
                    shouldStop: runMode === 'PRODUCTION' && (confirmed || timedOut),
                    firstBallot: firstBallot, noDigitsStreak: missingFrames,
                    guidance: showGuidance ? guidance : null };
                // Các thông báo hướng đến người sử dụng, không phơi thuật ngữ thuật toán.
                // Số lần khớp được tính trên cửa sổ ROI, không phải số lần chạy Tesseract.
                if (timedOut) {
                    presentFeedback('TIMEOUT', uiMessage('timeout'));
                } else if (justConfirmed) {
                    presentFeedback('CONFIRMED', uiMessage('confirmed'));
                } else if (showGuidance) {
                    presentFeedback('GUIDANCE', guidance);
                    lastProgressKey = '';
                } else if (firstBallot) {
                    lastProgressKey = winner + ':' + votes;
                    presentFeedback('FIRST_VOTE', uiMessage('first_vote', {min_votes: policy.minVotes}));
                } else if (votes > 0) {
                    const progressKey = winner + ':' + votes;
                    if (progressKey !== lastProgressKey) {
                        lastProgressKey = progressKey;
                        presentFeedback('PROGRESS', uiMessage('progress', {votes:votes, min_votes:policy.minVotes}));
                    }
                } else {
                    lastProgressKey = '';
                }
                if (result.shouldStop) finalResult = result;
                if (typeof contextForPass.onFrame === 'function') contextForPass.onFrame(result);
                return result;
            } finally { locked = false; }
        }
        return {
            scan: scan,
            getState: function () { return { frames: frameIndex, selection: selection,
                confirmation: Object.assign({}, policy), window: window.slice(),
                confirmed: confirmed, cccd: confirmedNumber, runMode: runMode,
                status: timedOut ? 'TIMEOUT' : (confirmed ? 'CONFIRMED' : 'SCANNING'),
                maxScanMs: maxScanMs, elapsedMs: scanningStartedAt === null ? 0 : now() - scanningStartedAt,
                shouldStop: runMode === 'PRODUCTION' && (confirmed || timedOut), noDigitsStreak: missingFrames,
                firstConsensus: firstConsensus, firstConfirmation: firstConfirmation }; }
        };
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            const existing = document.querySelector('script[data-cccd-ocr-tesseract="1"]');
            if (existing) {
                if (global.Tesseract && typeof global.Tesseract.createWorker === 'function') {
                    resolve();
                    return;
                }
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.dataset.cccdOcrTesseract = '1';
            script.onload = resolve;
            script.onerror = function () {
                reject(new CccdOcrError(
                    'TESSERACT_LOAD_FAILED',
                    'Không tải được Tesseract.js tại ' + src
                ));
            };
            document.head.appendChild(script);
        });
    }
    async function ensureTesseract() {
        if (global.Tesseract && typeof global.Tesseract.createWorker === 'function') {
            return global.Tesseract;
        }
        if (!tesseractPromise) {
            tesseractPromise = loadScript(config.tesseractScriptPath)
                .then(function () {
                    if (!global.Tesseract || typeof global.Tesseract.createWorker !== 'function') {
                        throw new CccdOcrError(
                            'TESSERACT_UNAVAILABLE',
                            'Tesseract.js đã tải nhưng không có createWorker.'
                        );
                    }
                    return global.Tesseract;
                })
                .catch(function (error) {
                    tesseractPromise = null;
                    throw error;
                });
        }
        return tesseractPromise;
    }
    async function init() {
        if (worker) return worker;
        if (workerPromise) return workerPromise;
        workerPromise = (async function () {
            const Tesseract = await ensureTesseract();
            const instance = await Tesseract.createWorker(
                config.language,
                config.oem,
                {
                    workerPath: config.workerPath,
                    corePath: config.corePath,
                    langPath: config.langPath,
                    errorHandler: function (error) {
                        console.error('CCCD OCR worker error:', error);
                    }
                }
            );
            await instance.setParameters({
                tessedit_char_whitelist: '0123456789',
                preserve_interword_spaces: '1',
                user_defined_dpi: String(config.dpi),
                classify_bln_numeric_mode: '1'
            });
            worker = instance;
            workerPromise = null;
            return worker;
        })().catch(function (error) {
            workerPromise = null;
            if (error instanceof CccdOcrError) throw error;
            throw new CccdOcrError(
                'OCR_INIT_FAILED',
                'Không khởi tạo được bộ nhận dạng CCCD.',
                { cause: error }
            );
        });
        return workerPromise;
    }
    function getSourceSize(source) {
        if (!source) return null;
        if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
            return { width: source.videoWidth, height: source.videoHeight };
        }
        if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
            return {
                width: source.naturalWidth || source.width,
                height: source.naturalHeight || source.height
            };
        }
        const width = source.width;
        const height = source.height;
        if (Number.isFinite(width) && Number.isFinite(height)) {
            return { width: width, height: height };
        }
        return null;
    }
    function loadBlobAsImage(blob) {
        return new Promise(function (resolve, reject) {
            const url = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = function () {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new CccdOcrError(
                    'INVALID_IMAGE',
                    'Không thể mở hình ảnh đầu vào.'
                ));
            };
            image.src = url;
        });
    }
    async function normalizeSource(source) {
        if (!source) {
            throw new CccdOcrError('INVALID_SOURCE', 'Chưa truyền hình ảnh vào CCCD OCR.');
        }
        if (typeof Blob !== 'undefined' && source instanceof Blob) {
            return loadBlobAsImage(source);
        }
        const size = getSourceSize(source);
        if (!size || size.width <= 0 || size.height <= 0) {
            throw new CccdOcrError(
                'INVALID_SOURCE',
                'Hình ảnh đầu vào không có kích thước hợp lệ.'
            );
        }
        return source;
    }
    function cropVertical(source, yRatio, hRatio) {
        const size = getSourceSize(source);
        const sy = Math.max(0, Math.round(size.height * yRatio));
        const sh = Math.min(
            size.height - sy,
            Math.max(1, Math.round(size.height * hRatio))
        );
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = sh;
        canvas.getContext('2d').drawImage(
            source,
            0, sy, size.width, sh,
            0, 0, size.width, sh
        );
        return canvas;
    }
    // Hai pass: (0) thang xam + tang tuong phan, (1) tuong phan manh hon.
    // Dung noi suy khi phong to, khong nhi phan hoa Otsu lam mat net so nho.
    function preprocess(source, mode) {
        const size = getSourceSize(source);
        let scale = config.targetWidth / Math.max(1, size.width);
        scale = Math.max(1, Math.min(4, scale));
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(size.width * scale));
        out.height = Math.max(1, Math.round(size.height * scale));
        if (out.width * out.height > config.maxPixels) {
            const safe = Math.sqrt(config.maxPixels / (out.width * out.height));
            out.width = Math.max(1, Math.round(out.width * safe));
            out.height = Math.max(1, Math.round(out.height * safe));
        }
        const ctx = out.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, out.width, out.height);
        const imageData = ctx.getImageData(0, 0, out.width, out.height);
        const data = imageData.data;
        const histogram = new Uint32Array(256);
        const gray = new Uint8Array(data.length / 4);
        let sum = 0;
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const g = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            gray[j] = g;
            histogram[g]++;
            sum += g;
        }
        const n = gray.length;
        const cutoff = Math.max(1, Math.round(n * 0.02));
        let low = 0, high = 255, count = 0;
        for (let i = 0; i < 256; i++) {
            count += histogram[i];
            if (count >= cutoff) { low = i; break; }
        }
        count = 0;
        for (let i = 255; i >= 0; i--) {
            count += histogram[i];
            if (count >= cutoff) { high = i; break; }
        }
        if (high - low < 40) { low = 0; high = 255; }
        const gain = mode === 1 ? 1.30 : 1.08;
        // Nen den/chu sang: chuyen sang chu den/nen sang de Tesseract de doc hon.
        const invert = mode === 1 && sum / Math.max(1, n) < 105;
        const range = Math.max(1, high - low);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            let value = (gray[j] - low) * 255 / range;
            value = Math.max(0, Math.min(255, (value - 127.5) * gain + 127.5));
            if (invert) value = 255 - value;
            data[i] = data[i + 1] = data[i + 2] = Math.round(value);
        }
        ctx.putImageData(imageData, 0, 0);
        out._cccdPreprocessInfo = {
            grayscale: true, smoothing: 'high',
            histogramLow: low, histogramHigh: high,
            contrastGain: gain, invert: invert
        };
        return out;
    }
    function extract12(text) {
        const lines = String(text || '').split(/\r?\n/);
        for (const line of lines) {
            // Lay mot day 12 so doc lap, ke ca khi OCR con nhan them so khac.
            // Khong cat dai day 13+ so thanh 12 so vi co the sai CCCD.
            const match = line.match(/(?:^|\D)(\d{12})(?!\d)/);
            if (match) return match[1];
        }
        for (const line of lines) {
            // Chap nhan CCCD co khoang trang/dau gach chen giua cac cum so.
            // Khong tu bo sung chu so OCR bi thieu.
            const matches = line.match(/\d+(?:[ \t.-]+\d+)*/g) || [];
            for (const item of matches) {
                const digits = item.replace(/\D/g, '');
                if (digits.length === 12) return digits;
            }
        }
        return '';
    }
    async function recognizeAttempt(source, passIndex, context) {
        const ctx = context || {};
        ensureSession();
        const passes = DEFAULT_PASSES.map(function(pass, i){ return Object.assign({index:i+1},pass); });

        if (!Number.isInteger(passIndex) || passIndex < 0 || passIndex >= passes.length) {
            throw new CccdOcrError(
                'INVALID_PASS',
                'passIndex không hợp lệ.',
                { passIndex: passIndex, passCount: passes.length }
            );
        }
        const pass = passes[passIndex];
        const attemptStartedAt = now();
        const waitMs = metricsState.lastAttemptEndedAt
            ? attemptStartedAt - metricsState.lastAttemptEndedAt
            : 0;
        metricsState.attemptCount += 1;
        const luot = metricsState.attemptCount;
        let normalizedSource = null;
        let sourceResolution = null;
        let cropResolution = null;
        let processedResolution = null;
        let preprocessMs = null;
        let ocrMs = null;
        let preprocessDetails = null;
        try {
            normalizedSource = await normalizeSource(source);
            sourceResolution = resolutionOf(normalizedSource);
            const ocrWorker = await init();
            const preprocessStartedAt = now();
            const cropped = cropVertical(normalizedSource, pass.cropY, pass.cropH);
            cropResolution = resolutionOf(cropped);
            const prepared = preprocess(cropped, pass.mode);
            if (typeof ctx.onPrepared === 'function') {
                try { ctx.onPrepared(normalizedSource, prepared); }
                catch (e) { console.warn('[CCCD OCR] onPrepared:', e); }
            }
            preprocessDetails = prepared._cccdPreprocessInfo || null;
            processedResolution = resolutionOf(prepared);
            preprocessMs = now() - preprocessStartedAt;
            const ocrStartedAt = now();
            await ocrWorker.setParameters({
                tessedit_pageseg_mode: pass.psm,
                tessedit_char_whitelist: '0123456789',
                classify_bln_numeric_mode: '1'
            });
            const result = await ocrWorker.recognize(prepared);
            ocrMs = now() - ocrStartedAt;
            const data = result.data || {};
            const rawText = String(data.text || '').trim();
            const predictedText = rawText.replace(/\D/g, '');
            const confidence = Number(data.confidence);
            const cccd = extract12(rawText);
            const digitHeight = findDigitHeight(data, prepared.height, cropped.height);
            const endedAt = now();
            metricsState.lastAttemptEndedAt = endedAt;
            const frameStartedAt = Number(ctx.frameStartedAt);
            const captureMs = Number(ctx.captureMs);
            const metrics = {
                luot: luot,
                pass: pass.index,
                passLabel: pass.label,
                confidence: Number.isFinite(confidence) ? confidence : NaN,
                rawText: rawText,
                textDuKien: predictedText,
                textLength: predictedText.length,
                captureMs: Number.isFinite(captureMs) ? captureMs : null,
                frameIntervalMs: ctx.frameIntervalMs == null ? null : Number(ctx.frameIntervalMs),
                actualFrameIntervalMs: ctx.actualFrameIntervalMs == null ? null : Number(ctx.actualFrameIntervalMs),
                preprocessMs: preprocessMs,
                ocrMs: ocrMs,
                frameToResultMs: Number.isFinite(frameStartedAt)
                    ? endedAt - frameStartedAt
                    : endedAt - attemptStartedAt,
                waitMs: waitMs,
                elapsedMs: endedAt - metricsState.sessionStartedAt,
                cameraResolution: ctx.cameraResolution || null,
                roiResolution: ctx.roiResolution || sourceResolution,
                roiCaptureResolution: ctx.roiCaptureResolution || null,
                roiWidthPx: ctx.roiWidthPx == null ? null : ctx.roiWidthPx,
                roiHeightPx: ctx.roiHeightPx == null ? null : ctx.roiHeightPx,
                imageOffsetXpx: ctx.imageOffsetXpx == null ? null : ctx.imageOffsetXpx,
                imageOffsetYpx: ctx.imageOffsetYpx == null ? null : ctx.imageOffsetYpx,
                imageZoom: ctx.imageZoom == null ? null : ctx.imageZoom,
                sourceResolution: sourceResolution,
                cropResolution: cropResolution,
                processedResolution: processedResolution,
                accepted: Boolean(cccd),
                recognized12: cccd,
                digitHeightProcessedPx: digitHeight.digitHeightProcessedPx,
                digitHeightRoiPx: digitHeight.digitHeightRoiPx,
                digitHeightMethod: digitHeight.digitHeightMethod,
                psm: pass.psm,
                preprocessMode: pass.mode,
                preprocessDetails: preprocessDetails,
                cropY: pass.cropY,
                cropH: pass.cropH
            };
            emitMetrics(metrics);
            return {
                cccd: cccd,
                rawText: rawText,
                predictedText: predictedText,
                confidence: Number.isFinite(confidence) ? confidence : NaN,
                passIndex: pass.index,
                passLabel: pass.label,
                durationMs: endedAt - attemptStartedAt,
                metrics: metrics
            };
        } catch (error) {
            const endedAt = now();
            metricsState.lastAttemptEndedAt = endedAt;
            const frameStartedAt = Number(ctx.frameStartedAt);
            const captureMs = Number(ctx.captureMs);
            const errorMetrics = {
                luot: luot,
                pass: pass.index,
                passLabel: pass.label,
                confidence: NaN,
                rawText: '',
                textDuKien: '',
                textLength: 0,
                captureMs: Number.isFinite(captureMs) ? captureMs : null,
                frameIntervalMs: ctx.frameIntervalMs == null ? null : Number(ctx.frameIntervalMs),
                actualFrameIntervalMs: ctx.actualFrameIntervalMs == null ? null : Number(ctx.actualFrameIntervalMs),
                preprocessMs: preprocessMs,
                ocrMs: ocrMs,
                frameToResultMs: Number.isFinite(frameStartedAt)
                    ? endedAt - frameStartedAt
                    : endedAt - attemptStartedAt,
                waitMs: waitMs,
                elapsedMs: endedAt - metricsState.sessionStartedAt,
                cameraResolution: ctx.cameraResolution || null,
                roiResolution: ctx.roiResolution || sourceResolution,
                roiCaptureResolution: ctx.roiCaptureResolution || null,
                roiWidthPx: ctx.roiWidthPx == null ? null : ctx.roiWidthPx,
                roiHeightPx: ctx.roiHeightPx == null ? null : ctx.roiHeightPx,
                imageOffsetXpx: ctx.imageOffsetXpx == null ? null : ctx.imageOffsetXpx,
                imageOffsetYpx: ctx.imageOffsetYpx == null ? null : ctx.imageOffsetYpx,
                imageZoom: ctx.imageZoom == null ? null : ctx.imageZoom,
                sourceResolution: sourceResolution,
                cropResolution: cropResolution,
                processedResolution: processedResolution,
                accepted: false,
                recognized12: '',
                digitHeightProcessedPx: null,
                digitHeightRoiPx: null,
                digitHeightMethod: 'unavailable',
                psm: pass.psm,
                preprocessMode: pass.mode,
                preprocessDetails: preprocessDetails,
                cropY: pass.cropY,
                cropH: pass.cropH,
                errorCode: error && error.code ? error.code : 'OCR_FAILED',
                errorMessage: error && error.message ? error.message : String(error)
            };
            emitMetrics(errorMetrics);
            if (error instanceof CccdOcrError) throw error;
            throw new CccdOcrError(
                'OCR_FAILED',
                'Không thể nhận dạng hình ảnh CCCD.',
                {
                    passIndex: pass.index,
                    passLabel: pass.label,
                    metrics: errorMetrics,
                    cause: error
                }
            );
        }
    }
    // API nghiệp vụ: recognizeDetailed KHÔNG trả CCCD trước khi đạt Voting.
    // Dùng cùng session qua nhiều ROI khác nhau; startSession() tạo phiên mới.
    let defaultVotingSession = null;
    async function recognizeDetailed(source, options) {
        const opts = options || {};
        await roiReady;
        if (opts.newSession === true || !defaultVotingSession ||
            (opts.passSelection && opts.passSelection !== defaultVotingSession.getState().selection)) {
            startSession();
            defaultVotingSession = createVotingSession(opts);
        }
        const result = await defaultVotingSession.scan(source, opts.context || {});
        return Object.assign({}, result, {
            accepted: result.confirmed,
            attempts: result.rows,
            // candidate12 là phát hiện tạm thời; cccd chỉ có khi xác nhận qua voting.
            confirmed: result.confirmed
        });
    }
    async function recognize(source, options) {
        const result = await recognizeDetailed(source, options);
        return result.cccd;
    }
    function cropGuideFromVideo(video, guideElement) {
        const vw = video.videoWidth, vh = video.videoHeight;
        if (!vw || !vh) return null;
        if (!guideElement) return video;
        const rect = video.getBoundingClientRect();
        const box = guideElement.getBoundingClientRect();
        const css = global.getComputedStyle(video);
        const objectFit = css.objectFit || 'fill';
        const factor = objectFit === 'contain'
            ? Math.min(rect.width / vw, rect.height / vh)
            : objectFit === 'cover'
                ? Math.max(rect.width / vw, rect.height / vh)
                : null;
        const sxScale = factor || rect.width / vw;
        const syScale = factor || rect.height / vh;
        const drawnW = vw * sxScale, drawnH = vh * syScale;
        const offX = (rect.width - drawnW) / 2;
        const offY = (rect.height - drawnH) / 2;
        const x1 = Math.max(0, Math.floor((box.left - rect.left - offX) / sxScale));
        const y1 = Math.max(0, Math.floor((box.top - rect.top - offY) / syScale));
        const x2 = Math.min(vw, Math.ceil((box.right - rect.left - offX) / sxScale));
        const y2 = Math.min(vh, Math.ceil((box.bottom - rect.top - offY) / syScale));
        if (x2 <= x1 || y2 <= y1) return null;
        const canvas = document.createElement('canvas');
        canvas.width = x2 - x1;
        canvas.height = y2 - y1;
        canvas.getContext('2d').drawImage(video, x1, y1,
            canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        return canvas;
    }
    // Khi giao diện truyền imageElement, JS tự lấy đúng ROI đang hiển thị,
    // kể cả ảnh đã zoom/dịch chuyển. Không OCR lại ảnh preview bị thu nhỏ.
    function cropGuideFromImage(source, imageElement, guideElement) {
        if (!imageElement || !guideElement) return source;
        const size = getSourceSize(source);
        const box = guideElement.getBoundingClientRect();
        const rect = imageElement.getBoundingClientRect();
        if (!size || !size.width || !size.height || !rect.width || !rect.height) return null;
        const scale = Math.min(rect.width / size.width, rect.height / size.height);
        const drawnW = size.width * scale, drawnH = size.height * scale;
        const offX = (rect.width - drawnW) / 2, offY = (rect.height - drawnH) / 2;
        const x1 = Math.max(0, Math.floor((box.left - rect.left - offX) / scale));
        const y1 = Math.max(0, Math.floor((box.top - rect.top - offY) / scale));
        const x2 = Math.min(size.width, Math.ceil((box.right - rect.left - offX) / scale));
        const y2 = Math.min(size.height, Math.ceil((box.bottom - rect.top - offY) / scale));
        if (x2 <= x1 || y2 <= y1) return null;
        const canvas = document.createElement('canvas');
        canvas.width = x2 - x1;
        canvas.height = y2 - y1;
        canvas.getContext('2d').drawImage(source, x1, y1,
            canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        return canvas;
    }
    function resolveElement(input) {
        return typeof input === 'string' ? document.querySelector(input) : input;
    }
    // Kích thước ROI dùng chung: không lưu top/left; từng chức năng tự đặt vị trí.
    const DEFAULT_ROI_SIZE = Object.freeze({ widthPx: 200, heightPx: 38 });
    let configuredRoiSize = { widthPx: CCCD_OCR_SETTINGS.roi.width_px,
        heightPx: CCCD_OCR_SETTINGS.roi.height_px };
    function normalizeRoiSize(input) {
        const raw = input && input.roi ? input.roi : (input || {});
        const width = Number(raw.widthPx !== undefined ? raw.widthPx : raw.width_px);
        const height = Number(raw.heightPx !== undefined ? raw.heightPx : raw.height_px);
        if (!Number.isSafeInteger(width) || width < 40 || width > 3000 ||
            !Number.isSafeInteger(height) || height < 20 || height > 2000) {
            throw new CccdOcrError('INVALID_ROI_SIZE',
                'ROI: chiều ngang 40–3000px và chiều cao 20–2000px (số nguyên).');
        }
        return { widthPx: width, heightPx: height };
    }
    function getRoiSize() {
        return Object.assign({}, configuredRoiSize);
    }
    function setRoiSize(value) {
        configuredRoiSize = normalizeRoiSize(value);
        return getRoiSize();
    }
    // Chỉ đổi kích thước. Vị trí left/top vẫn do CSS ở từng ứng dụng tự quyết định.
    function applyRoiSize(guideElement, value) {
        const guide = resolveElement(guideElement);
        if (!guide) throw new CccdOcrError('INVALID_ROI', 'Không tìm thấy khung ROI.');
        const size = value ? normalizeRoiSize(value) : getRoiSize();
        guide.style.width = size.widthPx + 'px';
        guide.style.height = size.heightPx + 'px';
        if (guide.hasAttribute('data-cccd-roi')) applyUiLayout(guide);
        return size;
    }
    // API giữ để tương thích với giao diện kiểm thử; hoàn toàn không fetch JSON.
    // Muốn nạp lại bản mới vừa lưu trên server, Index gọi route GET do Laravel đọc JS.
    function loadRoiSize() {
        applyStoredSettings(getStoredSettings());
        return Promise.resolve({roi: getRoiSize(), saved:true,
            confirmation: getConfirmation(), passSelection: getPassSelection(),
            frameIntervalMs:getFrameIntervalMs(), runMode:getRunMode(),
            production:getProduction(), feedback:getFeedback(),
            updatedAt:currentSettings.updated_at});
    }

    // Chuẩn hóa ROI về đúng kích thước pixel được chốt trước khi đưa vào OCR.
    // ROI cắt từ frame gốc có thể lớn/nhỏ theo camera, nhưng OCR luôn nhận cùng WxH.
    function normalizeRoiPixels(source) {
        const size = getRoiSize();
        const original = getSourceSize(source);
        if (!original || !original.width || !original.height) return null;
        if (original.width === size.widthPx && original.height === size.heightPx) return source;
        const canvas = document.createElement('canvas');
        canvas.width = size.widthPx;
        canvas.height = size.heightPx;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    // Tự nạp ROI khi chỉ import script JS; ứng dụng khác có thể await CccdOcr.roiReady.
    // Không chọn vị trí: app quyết định top/left. Các khung [data-cccd-roi] sẽ tự cập nhật.
    function autoApplyRoiToDocument() {
        if (!global.document) return;
        global.document.querySelectorAll('[data-cccd-roi]').forEach(function(guide) {
            applyRoiSize(guide);
            bindFeedback(guide);
        });
    }
    // Khởi tạo trực tiếp từ JS, không phụ thuộc API/route cấu hình.
    const roiReady = Promise.resolve().then(function () {
        applyStoredSettings(CCCD_OCR_SETTINGS);
        if (global.document && global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', autoApplyRoiToDocument, {once:true});
        } else autoApplyRoiToDocument();
        return {roi:getRoiSize(),saved:true};
    });
    if (global.addEventListener && global.document) {
        global.addEventListener('resize', function () { applyUiLayout(); }, {passive:true});
    }
    async function terminate() {
        if (worker) {
            try { await worker.terminate(); }
            catch (e) { console.warn('[CCCD OCR] terminate:', e); }
        }
        worker = null;
        workerPromise = null;
        metricsState.active = false;
        metricsState.sessionStartedAt = 0;
        metricsState.lastAttemptEndedAt = 0;
        metricsState.attemptCount = 0;
        defaultVotingSession = null;
    }
    // Lõi OCR không phụ thuộc giao diện, bảng, biểu đồ, lịch sử hay API ghi log.
    global.CccdOcr = Object.freeze({
        configure: configure,
        getConfig: function () { return Object.assign({}, config); },
        setConsoleLogging: setConsoleLogging,
        startSession: startSession,
        getSessionState: getSessionState,
        onMetrics: onMetrics,
        init: init,
        recognize: recognize,
        recognizeDetailed: recognizeDetailed,
        recognizeAttempt: recognizeAttempt,
        getPasses: getPasses,
        setPassSelection: setPassSelection,
        getPassSelection: getPassSelection,
        setFrameIntervalMs: setFrameIntervalMs,
        getFrameIntervalMs: getFrameIntervalMs,
        setConfirmation: setConfirmation,
        getConfirmation: getConfirmation,
        createVotingSession: createVotingSession,
        setRunMode: setRunMode, getRunMode: getRunMode,
        setProduction: setProduction, getProduction: getProduction, getProductionMaxScanMs: getProductionMaxScanMs,
        setFeedback: setFeedback, getFeedback: getFeedback,
        bindFeedback: bindFeedback, unbindFeedback: unbindFeedback, resetFeedback: resetFeedback,
        roiReady: roiReady,
        normalizeSource: normalizeSource,
        resolutionOf: resolutionOf,
        cropGuideFromVideo: cropGuideFromVideo,
        cropGuideFromImage: cropGuideFromImage,
        normalizeRoiPixels: normalizeRoiPixels,
        normalizeRoiSize: normalizeRoiSize,
        getRoiSize: getRoiSize,
        setRoiSize: setRoiSize,
        applyRoiSize: applyRoiSize,
        loadRoiSize: loadRoiSize,
        getStoredSettings: getStoredSettings,
        applyStoredSettings: applyStoredSettings,
        getTelemetry: getTelemetry,
        getUiSettings: getUiSettings,
        setUiSettings: setUiSettings,
        applyUiLayout: applyUiLayout,
        terminate: terminate,
        buildId: '20261010-production-timeout-15',
        CccdOcrError: CccdOcrError
    });
})(window);
