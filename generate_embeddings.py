import os
import pickle
import numpy as np

from deepface import DeepFace

# ==============================
# SETTINGS
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "101_MD_SAJID_KHAN"
)

EMBEDDINGS_PATH = os.path.join(
    BASE_DIR,
    "face_embeddings.pkl"
)

STUDENT_ID = "101"
STUDENT_NAME = "MD SAJID KHAN"

# ==============================
# CHECK DATASET
# ==============================

if not os.path.exists(DATASET_DIR):
    print("Dataset folder not found:")
    print(DATASET_DIR)
    exit()

image_files = [
    file for file in os.listdir(DATASET_DIR)
    if file.lower().endswith((".jpg", ".jpeg", ".png"))
]

image_files.sort()

print("\n======================================")
print("Face Embedding Generation")
print("======================================")
print("Student ID   :", STUDENT_ID)
print("Student Name :", STUDENT_NAME)
print("Images found :", len(image_files))
print("======================================")

if len(image_files) == 0:
    print("No images found in the dataset folder.")
    exit()

# ==============================
# GENERATE EMBEDDINGS
# ==============================

stored_data = []

for index, image_file in enumerate(image_files, start=1):

    image_path = os.path.join(
        DATASET_DIR,
        image_file
    )

    print(
        f"\nProcessing image {index}/{len(image_files)}: "
        f"{image_file}"
    )

    try:

        result = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet512",
            detector_backend="opencv",
            enforce_detection=True
        )

        embedding = result[0]["embedding"]

        stored_data.append({
            "student_id": STUDENT_ID,
            "student_name": STUDENT_NAME,
            "embedding": embedding
        })

        print("Embedding generated successfully.")

    except Exception as e:

        print("Failed to process image.")
        print("Error:", e)

# ==============================
# SAVE EMBEDDINGS
# ==============================

if len(stored_data) == 0:
    print("\nNo embeddings were generated.")
    exit()

with open(EMBEDDINGS_PATH, "wb") as file:
    pickle.dump(stored_data, file)

print("\n======================================")
print("Embedding generation completed!")
print("======================================")
print("Total embeddings :", len(stored_data))
print("Embedding size   :", len(stored_data[0]["embedding"]))
print("Saved file       :", EMBEDDINGS_PATH)
print("======================================")