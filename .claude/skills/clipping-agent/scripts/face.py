"""Shared YuNet face detector on onnxruntime (CPU, no OpenCV).

detect_frame(frame_rgb) -> list of [x, y, w, h, score] in frame-pixel coords.
Validated in Phase 0: ~10-25ms/frame on this ARM64 CPU.
"""
import numpy as np
import onnxruntime as ort
from huggingface_hub import hf_hub_download
from PIL import Image
import config

_SESS = None
_OUT_NAMES = None


def session():
    global _SESS, _OUT_NAMES
    if _SESS is None:
        mp = hf_hub_download(config.FACE_REPO, config.FACE_FILE)
        _SESS = ort.InferenceSession(mp, providers=["CPUExecutionProvider"])
        _OUT_NAMES = [o.name for o in _SESS.get_outputs()]
    return _SESS


def _letterbox(frame_rgb, size):
    H, W = frame_rgb.shape[:2]
    scale = min(size / W, size / H)
    nw, nh = int(round(W * scale)), int(round(H * scale))
    img = Image.fromarray(frame_rgb).resize((nw, nh), Image.BILINEAR)
    canvas = np.zeros((size, size, 3), np.uint8)
    px, py = (size - nw) // 2, (size - nh) // 2
    canvas[py:py + nh, px:px + nw] = np.asarray(img)
    return canvas, scale, px, py


def _decode(od, size, score_thr):
    dets = []
    for s in (8, 16, 32):
        cls = od[f"cls_{s}"][0][:, 0]
        obj = od[f"obj_{s}"][0][:, 0]
        bbox = od[f"bbox_{s}"][0]
        fw = size // s
        idx = np.arange(cls.shape[0])
        cols, rows = idx % fw, idx // fw
        cx = (cols + bbox[:, 0]) * s
        cy = (rows + bbox[:, 1]) * s
        w = np.exp(bbox[:, 2]) * s
        h = np.exp(bbox[:, 3]) * s
        score = np.sqrt(np.clip(cls, 0, 1) * np.clip(obj, 0, 1))
        keep = np.where(score >= score_thr)[0]
        for i in keep:
            dets.append([cx[i] - w[i] / 2, cy[i] - h[i] / 2, w[i], h[i], float(score[i])])
    return np.array(dets) if dets else np.zeros((0, 5))


def _nms(dets, iou_thr=0.3):
    if len(dets) == 0:
        return dets
    x1, y1 = dets[:, 0], dets[:, 1]
    x2, y2 = x1 + dets[:, 2], y1 + dets[:, 3]
    areas = dets[:, 2] * dets[:, 3]
    order = dets[:, 4].argsort()[::-1]
    keep = []
    while order.size:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]]); yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]]); yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0, xx2 - xx1); h = np.maximum(0, yy2 - yy1)
        inter = w * h
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-9)
        order = order[1:][iou <= iou_thr]
    return dets[keep]


def detect_frame(frame_rgb, score_thr=None):
    score_thr = config.FACE_SCORE_THR if score_thr is None else score_thr
    size = config.FACE_INPUT
    canvas, scale, px, py = _letterbox(frame_rgb, size)
    blob = np.transpose(canvas[:, :, ::-1].astype(np.float32), (2, 0, 1))[None]  # RGB->BGR, NCHW
    outs = session().run(None, {"input": blob})
    od = {name: outs[i] for i, name in enumerate(_OUT_NAMES)}
    dets = _nms(_decode(od, size, score_thr))
    res = []
    for d in dets:
        res.append([float((d[0] - px) / scale), float((d[1] - py) / scale),
                    float(d[2] / scale), float(d[3] / scale), float(d[4])])
    return res
