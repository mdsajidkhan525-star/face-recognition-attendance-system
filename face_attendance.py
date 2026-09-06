import requests
import cv2
import os

from deepface import DeepFace
from recognition.recognition import recognize_face


DJANGO_ATTENDANCE_URL = "http://127.0.0.1:8000/attendance/"


camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("❌ Camera open nahi ho raha!")
    exit()

print("📷 Face Attendance Camera Started!")
print("SPACE = Attendance check")
print("Q = Exit")


while True:

    ret, frame = camera.read()

    if not ret:
        print("❌ Camera se frame nahi mil raha!")
        break

    cv2.imshow("Face Attendance System", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord(" "):

        print("\n📸 Photo captured!")

        try:

            print("🔍 Face recognition processing...")
            print("⏳ Please wait...")

            result = DeepFace.represent(
                img_path=frame,
                model_name="Facenet512",
                detector_backend="opencv",
                enforce_detection=True
            )

            test_embedding = result[0]["embedding"]

            match = recognize_face(test_embedding)

            print("\n🎯 Recognition Result")
            print("Student ID   :", match["student_id"])
            print("Student Name :", match["student_name"])
            print("Similarity   :", round(match["similarity"], 4))

            if match["similarity"] >= 0.80:

                print("Status       : ✅ FACE RECOGNIZED")

                attendance_data = {
                    "student_id": match["student_id"],
                    "student_name": match["student_name"],
                    "similarity": match["similarity"]
                }

                print("\n📡 Sending attendance to Django...")

                response = requests.post(
                    DJANGO_ATTENDANCE_URL,
                    json=attendance_data,
                    timeout=30
                )

                print("\n📋 Django Attendance Response")
                print(response.status_code)
                print(response.json())

            else:

                print("Status       : ❌ FACE NOT RECOGNIZED")

        except Exception as e:

            print("❌ Error:", e)

    elif key == ord("q"):

        print("❌ Camera closed.")
        break


camera.release()
cv2.destroyAllWindows()