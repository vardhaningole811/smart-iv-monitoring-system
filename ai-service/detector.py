"""
IV line vision checks: red-dominant region ratio (backflow), bright upper region (empty chamber),
blob count (air). Each function returns True if that anomaly is detected.
"""

import cv2
import numpy as np

BACKFLOW_RED_FRACTION = 0.08
EMPTY_UPPER_MEAN_BRIGHTNESS = 210
AIR_BLOB_COUNT_THRESHOLD = 3


def detect_backflow(bgr: np.ndarray) -> bool:
    """HSV threshold for red (two hue ranges); if red-like pixels exceed 8% of pixels, flag backflow."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lower1 = np.array([0, 80, 60], dtype=np.uint8)
    upper1 = np.array([15, 255, 255], dtype=np.uint8)
    lower2 = np.array([160, 80, 60], dtype=np.uint8)
    upper2 = np.array([179, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower1, upper1) | cv2.inRange(hsv, lower2, upper2)
    ratio = float(np.count_nonzero(mask)) / float(mask.size)
    return ratio > BACKFLOW_RED_FRACTION


def detect_empty_iv_bottle(bgr: np.ndarray) -> bool:
    """Grayscale upper third; apply threshold 200 to isolate bright regions, then mean brightness of that third > 210 → empty."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    h = gray.shape[0]
    upper = gray[0 : max(1, h // 3), :]
    _, _ = cv2.threshold(upper, 200, 255, cv2.THRESH_BINARY)
    mean_brightness = float(np.mean(upper))
    return mean_brightness > EMPTY_UPPER_MEAN_BRIGHTNESS


def detect_air_bubbles(bgr: np.ndarray) -> bool:
    """SimpleBlobDetector on grayscale: circular blobs in 100–2000 px²; many blobs suggest air."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    params = cv2.SimpleBlobDetector_Params()
    params.filterByCircularity = True
    params.minCircularity = 0.7
    params.filterByArea = True
    params.minArea = 100
    params.maxArea = 2000
    params.filterByConvexity = False
    params.filterByInertia = False
    params.filterByColor = False
    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(gray)
    return len(keypoints) > AIR_BLOB_COUNT_THRESHOLD


def run_detection_pipeline(bgr: np.ndarray) -> str:
    """Run checks in order: backflow → empty → air; otherwise normal."""
    if detect_backflow(bgr):
        return "backflow"
    if detect_empty_iv_bottle(bgr):
        return "empty"
    if detect_air_bubbles(bgr):
        return "air_detected"
    return "normal"
