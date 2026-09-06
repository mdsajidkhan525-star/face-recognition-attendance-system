import cv2
import os
import sys
from deepface import DeepFace

# Project folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from recognition.recognition import recognize_face
from attendance import mark_attendance


# Camera start
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("❌ Camera open nahi ho raha!")
    exit()

print("📷 Live Attendance Camera Started!")
print("SPACE = Attendance check")
print("Q = Exit")


while True:

    ret, frame = camera.read()

    if not ret:
        print("❌ Camera se frame nahi mil raha!")
        break

    # Camera window
    cv2.imshow("Face Attendance System", frame)

    key = cv2.waitKey(1) & 0xFF


    # SPACE press
    if key == ord(" "):

        print("\n📸 Photo captured!")

        # Photo save
        image_path = os.path.join(
            BASE_DIR,
            "live_capture.jpg"
        )

        cv2.imwrite(image_path, frame)

        try:

            print("🔍 Face recognition processing...")
            print("⏳ Please wait...")

            # FaceNet512 embedding
            result = DeepFace.represent(
                img_path=frame,
                model_name="Facenet512",
                detector_backend="opencv",
                enforce_detection=True
            )

            test_embedding = result[0]["embedding"]

            # Recognition
            match = recognize_face(test_embedding)

            print("\n🎯 Recognition Result")
            print("Student ID   :", match["student_id"])
            print("Student Name :", match["student_name"])
            print("Similarity   :", round(match["similarity"], 4))


            # Recognition threshold
            if match["similarity"] >= 0.80:

                print("Status       : ✅ FACE RECOGNIZED")

                # Attendance
                attendance_result = mark_attendance(
                    student_id=match["student_id"],
                    student_name=match["student_name"],
                    similarity=match["similarity"]
                )

                print("\n📋 Attendance Result")
                print(attendance_result)

            else:

                print("Status       : ❌ FACE NOT RECOGNIZED")


        except Exception as e:

            print("❌ Error:", e)


    # Q press
    elif key == ord("q"):

        print("❌ Camera closed.")
        break


camera.release()
cv2.destroyAllWindows()