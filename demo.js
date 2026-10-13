(function () {
    'use strict';
    const core = window.CccdOcr;
    const $ = function (id) { return document.getElementById(id); };
    const btnStart = $('start');
    const btnStop = $('stop');
    const table = $('metrics-rows');
    let attempts = 0, valid = 0, ocrTotal = 0, frameTotal = 0;
    let lastFrame = 0;
    const milliseconds = function (n) { return Number.isFinite(Number(n)) && n !== null
        ? Math.round(Number(n)) + ' ms' : '—'; };
    function status(message, kind) { $('status').textContent = message; $('status').dataset.kind = kind || ''; }
    function reset() {
        attempts = valid = ocrTotal = frameTotal = lastFrame = 0;
        table.replaceChildren();
        $('number').textContent = '—';
        ['frames', 'attempts'].forEach(function (id) { $(id).textContent = '0'; });
        ['votes', 'avg-ocr', 'avg-latency', 'valid-rate', 'throughput'].forEach(function (id) { $(id).textContent = '—'; });
        $('elapsed').textContent = '0.0 s';
    }
    let latencyTotal = 0;
    const scanner = window.CccdOcrScanner.create({
        video: '#camera', guide: '#roi',
        onStatus: function (message) { status(message); },
        onError: function (error) { status(error.message || String(error), 'error'); },
        onFrame: function (frame) {
            lastFrame = frame.frameIndex || lastFrame;
            $('frames').textContent = String(lastFrame);
            $('elapsed').textContent = ((frame.elapsedMs || 0) / 1000).toFixed(1) + ' s';
            $('votes').textContent = (frame.voteCount || 0) + '/' + core.getConfirmation().minVotes;
            (frame.rows || []).forEach(function (row) {
                attempts++;
                if (row.accepted) valid++;
                ocrTotal += Number(row.ocrMs) || 0;
                latencyTotal += Number(row.frameToResultMs) || 0;
                const tr = document.createElement('tr');
                [frame.frameIndex, 'P' + row.pass,
                    Number.isFinite(row.confidence) ? row.confidence.toFixed(1) + '%' : '—',
                    milliseconds(row.preprocessMs), milliseconds(row.ocrMs), milliseconds(row.frameToResultMs),
                    row.accepted ? 'Có' : 'Không',
                    row.voteDecision ? String(frame.voteCount || 0) + '/' + core.getConfirmation().minVotes : '—'
                ].forEach(function (value) { const td = document.createElement('td'); td.textContent = String(value); tr.appendChild(td); });
                table.prepend(tr);
                while (table.children.length > 30) table.lastElementChild.remove();
            });
            $('attempts').textContent = String(attempts);
            $('avg-ocr').textContent = attempts ? milliseconds(ocrTotal / attempts) : '—';
            $('avg-latency').textContent = attempts ? milliseconds(latencyTotal / attempts) : '—';
            $('valid-rate').textContent = attempts ? valid + '/' + attempts + ' (' + (100 * valid / attempts).toFixed(1) + '%)' : '—';
            $('throughput').textContent = attempts && frame.elapsedMs > 0 ? (1000 * attempts / frame.elapsedMs).toFixed(2) + ' lượt/s' : '—';
        },
        onResult: function (result) {
            if (result.status === 'CONFIRMED') {
                $('number').textContent = result.cccd;
                status('Đã xác nhận số CCCD bằng Voting.', 'success');
            } else if (result.status === 'TIMEOUT') {
                status('Hết thời gian quét; chưa đủ phiếu xác nhận.', 'error');
            } else status('Đã dừng quét.');
        }
    });
    async function start() {
        if (scanner.isRunning()) return;
        reset(); latencyTotal = 0;
        await core.roiReady;
        const size = core.getRoiSize();
        $('roi-size').textContent = size.widthPx + ' × ' + size.heightPx;
        $('pass-selection').textContent = core.getPassSelection();
        btnStart.disabled = true;
        btnStop.disabled = false;
        try { await scanner.start(); }
        catch (error) { status('Lỗi: ' + (error.message || String(error)), 'error'); }
        finally { btnStart.disabled = false; btnStop.disabled = true; }
    }
    btnStart.addEventListener('click', function () { void start(); });
    btnStop.addEventListener('click', function () { scanner.stop(); btnStop.disabled = true; });
    window.addEventListener('beforeunload', function () { scanner.stop(); });
    if (location.protocol === 'file:') {
        status('Hãy chạy index.html qua localhost hoặc HTTPS (không dùng file://).', 'error');
    } else status('Sẵn sàng. Nhấn Bắt đầu quét để cấp quyền camera.');
})();
