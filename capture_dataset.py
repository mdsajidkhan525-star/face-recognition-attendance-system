import cv2
import os
import time

# ==============================
# SETTINGS
# ==============================

DATASET_DIR = "dataset"
TOTAL_IMAGES = 20

FACE_MODEL = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

os.makedirs(DATASET_DIR, exist_ok=True)

# ==============================
# STUDENT INFORMATION
# ==============================

student_id = input("Enter Student ID: ").strip()
student_name = input("Enter Student Name: ").strip()

if not student_id or not student_name:
    print("Student ID and Name cannot be empty.")
    exit()

safe_name = student_name.replace(" ", "_")

student_folder = os.path.join(
    DATASET_DIR,
    f"{student_id}_{safe_name}"
)

os.makedirs(student_folder, exist_ok=True)

# ==============================
# REMOVE OLD IMAGES
# ==============================

for file in os.listdir(student_folder):
    if file.lower().endswith((".jpg", ".jpeg", ".png")):
        os.remove(os.path.join(student_folder, file))

print("\nOld dataset images removed.")
print("Student ID   :", student_id)
print("Student Name :", student_name)
print("New Images   :", TOTAL_IMAGES)
print("Folder       :", student_folder)

# ==============================
# CAMERA
# ==============================

print("\nCamera will start in 3 seconds...")
time.sleep(3)

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open webcam.")
    exit()

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

face_detector = cv2.CascadeClassifier(FACE_MODEL)

count = 0
last_capture_time = 0
capture_interval = 1.2

print("\nCamera started.")
print("Keep your face clearly visible.")
print("Slowly change your face position.")
print("Press Q to quit.")

# ==============================
# CAPTURE LOOP
# ==============================

while True:

    ret, frame = camera.read()

    if not ret:
        print("Could not read webcam frame.")
        break

    frame = cv2.flip(frame, 1)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(120, 120)
    )

    cv2.putText(
        frame,
        f"Images: {count}/{TOTAL_IMAGES}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    # ==============================
    # ONE FACE DETECTED
    # ==============================

    if len(faces) == 1:

        x, y, w, h = faces[0]

        cv2.rectangle(
            frame,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            "Face detected",
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        current_time = time.time()

        if (
            count < TOTAL_IMAGES
            and current_time - last_capture_time >= capture_interval
        ):

            # Add margin around the detected face
            margin_x = int(w * 0.20)
            margin_y = int(h * 0.25)

            x1 = max(x - margin_x, 0)
            y1 = max(y - margin_y, 0)
            x2 = min(x + w + margin_x, frame.shape[1])
            y2 = min(y + h + margin_y, frame.shape[0])

            face_image = frame[y1:y2, x1:x2]

            face_image = cv2.resize(
                face_image,
                (224, 224),
                interpolation=cv2.INTER_AREA
            )

            count += 1

            image_path = os.path.join(
                student_folder,
                f"{count:02d}.jpg"
            )

            cv2.imwrite(
                image_path,
                face_image,
                [cv2.IMWRITE_JPEG_QUALITY, 95]
            )

            last_capture_time = current_time

            print(f"Image saved: {image_path}")

    # ==============================
    # MULTIPLE FACES
    # ==============================

    elif len(faces) > 1:

        cv2.putText(
            frame,
            "Multiple faces detected",
            (20, 75),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2
        )

    # ==============================
    # NO FACE
    # ==============================

    else:

        cv2.putText(
            frame,
            "No face detected",
            (20, 75),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2
        )

    cv2.imshow(
        "Face Dataset Collection",
        frame
    )

    # ==============================
    # COMPLETED
    # ==============================

    if count >= TOTAL_IMAGES:

        print("\n======================================")
        print("Dataset collection completed!")
        print(f"Total images: {count}")
        print(f"Saved in: {student_folder}")
        print("======================================")

        break

    # ==============================
    # QUIT
    # ==============================

    if cv2.waitKey(1) & 0xFF == ord("q"):
        print("\nDataset collection stopped.")
        break

# ==============================
# CLEANUP
# ==============================

camera.release()
cv2.destroyAllWindows()

print("\nProgram finished.")