import cv2

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("❌ Camera open nahi ho raha!")
    exit()

print("📷 Camera started!")
print("Photo lene ke liye SPACE press karein.")
print("Exit karne ke liye Q press karein.")

while True:
    ret, frame = camera.read()

    if not ret:
        print("❌ Camera se frame nahi mil raha!")
        break

    cv2.imshow("Face Attendance - Camera", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord(" "):
        cv2.imwrite("camera_photo.jpg", frame)
        print("✅ Photo captured!")
        print("Saved as: camera_photo.jpg")
        break

    elif key == ord("q"):
        print("❌ Camera closed.")
        break

camera.release()
cv2.destroyAllWindows()

# Webcam captured photo ka recognition test

test_image = os.path.join(BASE_DIR, "camera_photo.jpg")

result = DeepFace.represent(
    img_path=test_image,
    model_name="Facenet512",
    detector_backend="opencv",
    enforce_detection=True
)

test_embedding = result[0]["embedding"]

match = recognize_face(test_embedding)

print("\n📷 Webcam Recognition Test")
print("Student ID   :", match["student_id"])
print("Student Name :", match["student_name"])
print("Similarity   :", round(match["similarity"], 4))

if match["similarity"] >= 0.80:
    print("Status       : ✅ FACE RECOGNIZED")
else:
    print("Status       : ❌ FACE NOT RECOGNIZED")