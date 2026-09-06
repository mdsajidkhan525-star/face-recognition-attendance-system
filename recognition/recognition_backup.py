import os
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not configured.")

client = MongoClient(MONGO_URI)

db = client["face_recognition_attendance"]
faces_collection = db["faces"]


def cosine_similarity(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)

    denominator = np.linalg.norm(a) * np.linalg.norm(b)

    if denominator == 0:
        return -1.0

    return float(np.dot(a, b) / denominator)


def recognize_face(test_embedding):
    best_match = None
    best_similarity = -1.0

    documents = faces_collection.find(
        {},
        {
            "student_id": 1,
            "student_name": 1,
            "embedding": 1,
        }
    )

    for document in documents:
        stored_embedding = document.get("embedding")

        if not stored_embedding:
            continue

        if len(stored_embedding) != 512:
            continue

        similarity = cosine_similarity(
            test_embedding,
            stored_embedding
        )

        if similarity > best_similarity:
            best_similarity = similarity
            best_match = document

    if best_match is None:
        return None

    return {
        "student_id": best_match["student_id"],
        "student_name": best_match["student_name"],
        "similarity": float(best_similarity),
    }


if __name__ == "__main__":
    print("MongoDB face recognition module loaded successfully.")

    total_faces = faces_collection.count_documents({})

    print("Total stored face embeddings:", total_faces)

    if total_faces > 0:
        sample = faces_collection.find_one(
            {},
            {
                "student_id": 1,
                "student_name": 1,
                "image_index": 1,
                "embedding": 1,
            }
        )

        print("Student ID:", sample.get("student_id"))
        print("Student Name:", sample.get("student_name"))
        print("Image Index:", sample.get("image_index"))
        print("Embedding Size:", len(sample.get("embedding", [])))

    print("Cosine similarity function ready.")
    print("MongoDB recognition function ready.")