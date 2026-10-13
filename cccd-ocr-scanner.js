/**
 * Camera adapter cho CCCD OCR. Không phụ thuộc Laravel hoặc giao diện Tester.
 * Đặt cùng thư mục với cccd-ocr.js; dùng CccdOcrScanner.create({ video, guide, onFrame, onResult }).
 */
(function (global) {
    'use strict';
    const core = global.CccdOcr;
    if (!core) throw new Error('Nạp cccd-ocr.js trước cccd-ocr-scanner.js.');
    const resolve = function (node) {
        return typeof node === 'string' ? document.querySelector(node) : node;
    };
    const now = function () { return performance.now(); };
    const sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };

    function create(options) {
        const opts = options || {};
        const video = resolve(opts.video);
        const guide = resolve(opts.guide);
        if (!video || !guide) throw new Error('CccdOcrScanner: thiếu video hoặc guide.');
        let activePromise = null;
        let stopped = false;
        let stream = null;
        function notify(name, payload) {
            if (typeof opts[name] === 'function') opts[name](payload);
        }
        function stop() {
            stopped = true;
            // Dừng stream sớm; OCR đang xử lý sẽ hoàn tất lượt hiện tại trước khi trả.
            if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
        }
        function start() {
            if (activePromise) return activePromise;
            stopped = false;
            activePromise = (async function () {
                let startedAt = null;
                try {
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        throw new Error('Camera cần HTTPS hoặc localhost và quyền truy cập camera.');
                    }
                    await core.roiReady;
                    core.applyRoiSize(guide);
                    core.bindFeedback(guide);
                    notify('onStatus', 'Đang tải bộ nhận dạng…');
                    await core.init();
                    if (stopped) return { status: 'CANCELLED', cccd: '' };
                    notify('onStatus', 'Đang mở camera…');
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: opts.cameraConstraints || {
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 1920 }, height: { ideal: 1080 }
                        }
                    });
                    if (stopped) return { status: 'CANCELLED', cccd: '' };
                    video.srcObject = stream;
                    await video.play();
                    if (stopped) return { status: 'CANCELLED', cccd: '' };
                    core.startSession();
                    const voting = core.createVotingSession({
                        passSelection: opts.passSelection || core.getPassSelection(),
                        confirmation: core.getConfirmation(),
                        production: opts.production || core.getProduction(),
                        runMode: 'PRODUCTION'
                    });
                    const interval = core.getFrameIntervalMs();
                    let lastFrameStartedAt = null;
                    startedAt = now();
                    notify('onStatus', 'Đang quét');
                    while (!stopped) {
                        // Phòng trường hợp camera không cung cấp được ROI: vẫn kết thúc theo timeout.
                        if (now() - startedAt >= core.getProductionMaxScanMs()) {
                            const timeout = { status: 'TIMEOUT', cccd: '', confirmed: false,
                                elapsedMs: now() - startedAt, frameIndex: lastFrameStartedAt === null ? 0 : null };
                            notify('onResult', timeout);
                            return timeout;
                        }
                        if (lastFrameStartedAt !== null && interval > 0) {
                            while (!stopped && lastFrameStartedAt + interval > now()) {
                                await sleep(Math.min(40, lastFrameStartedAt + interval - now()));
                            }
                        }
                        if (stopped) break;
                        const frameStartedAt = now();
                        lastFrameStartedAt = frameStartedAt;
                        const captured = core.cropGuideFromVideo(video, guide);
                        if (!captured) { await sleep(60); continue; }
                        const normalized = core.normalizeRoiPixels(captured);
                        if (!normalized) throw new Error('ROI không hợp lệ.');
                        const frame = await voting.scan(normalized, {
                            makeContext: function () {
                                return {
                                    frameStartedAt: frameStartedAt,
                                    captureMs: now() - frameStartedAt,
                                    cameraResolution: core.resolutionOf(video),
                                    roiResolution: core.resolutionOf(normalized)
                                };
                            }
                        });
                        notify('onFrame', frame);
                        if (frame.shouldStop) {
                            const result = {
                                status: frame.confirmed ? 'CONFIRMED' : 'TIMEOUT',
                                cccd: frame.confirmed && /^\d{12}$/.test(frame.cccd) ? frame.cccd : '',
                                confirmed: Boolean(frame.confirmed),
                                elapsedMs: frame.elapsedMs,
                                frameIndex: frame.frameIndex,
                                firstConfirmation: frame.firstConfirmation || null
                            };
                            notify('onResult', result);
                            return result;
                        }
                    }
                    const stoppedResult = { status: 'CANCELLED', cccd: '',
                        elapsedMs: startedAt === null ? 0 : now() - startedAt };
                    notify('onResult', stoppedResult);
                    return stoppedResult;
                } catch (error) {
                    notify('onError', error);
                    throw error;
                } finally {
                    if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
                    stream = null;
                    video.pause();
                    video.srcObject = null;
                }
            })().finally(function () { activePromise = null; });
            return activePromise;
        }
        return Object.freeze({ start: start, stop: stop,
            isRunning: function () { return Boolean(activePromise); } });
    }
    global.CccdOcrScanner = Object.freeze({ create: create });
})(window);
