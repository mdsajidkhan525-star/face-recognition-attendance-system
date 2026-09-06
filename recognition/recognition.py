import os
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

ENV_PATH = os.path.join(
    BASE_DIR,
    "backend",
    ".env"
)

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI is not configured."
    )

client = MongoClient(MONGO_URI)

db = client["face_recognition_attendance"]

faces_collection = db["faces"]


# =========================================================
# CONFIGURATION
# =========================================================

MIN_EMBEDDING_SIZE = 512

MIN_STUDENT_MATCHES = 2

DEFAULT_THRESHOLD = 0.80


# =========================================================
# COSINE SIMILARITY
# =========================================================

def cosine_similarity(a, b):

    a = np.asarray(
        a,
        dtype=np.float32
    )

    b = np.asarray(
        b,
        dtype=np.float32
    )

    if a.size != MIN_EMBEDDING_SIZE:
        return -1.0

    if b.size != MIN_EMBEDDING_SIZE:
        return -1.0

    denominator = (
        np.linalg.norm(a) *
        np.linalg.norm(b)
    )

    if denominator <= 0:
        return -1.0

    similarity = (
        np.dot(a, b) /
        denominator
    )

    return float(similarity)


# =========================================================
# FACE RECOGNITION
# =========================================================

def recognize_face(
    test_embedding,
    threshold=DEFAULT_THRESHOLD
):

    test_embedding = np.asarray(
        test_embedding,
        dtype=np.float32
    )

    if test_embedding.size != MIN_EMBEDDING_SIZE:
        return None

    students = {}

    documents = faces_collection.find(
        {},
        {
            "student_id": 1,
            "student_name": 1,
            "embedding": 1,
            "image_index": 1
        }
    )

    for document in documents:

        student_id = document.get(
            "student_id"
        )

        student_name = document.get(
            "student_name",
            ""
        )

        stored_embedding = document.get(
            "embedding"
        )

        if not student_id:
            continue

        if not stored_embedding:
            continue

        if len(stored_embedding) != MIN_EMBEDDING_SIZE:
            continue

        similarity = cosine_similarity(
            test_embedding,
            stored_embedding
        )

        if similarity < 0:
            continue

        if student_id not in students:

            students[student_id] = {
                "student_id": student_id,
                "student_name": student_name,
                "similarities": []
            }

        students[student_id][
            "similarities"
        ].append(similarity)

    if not students:
        return None

    candidates = []

    for student_id, student_data in students.items():

        similarities = sorted(
            student_data["similarities"],
            reverse=True
        )

        best_similarity = similarities[0]

        top_matches = similarities[
            :min(
                MIN_STUDENT_MATCHES,
                len(similarities)
            )
        ]

        average_top_similarity = (
            sum(top_matches) /
            len(top_matches)
        )

        candidates.append({
            "student_id":
                student_data["student_id"],

            "student_name":
                student_data["student_name"],

            "best_similarity":
                best_similarity,

            "average_similarity":
                average_top_similarity,

            "match_count":
                len(similarities)
        })

    candidates.sort(
        key=lambda item: (
            item["average_similarity"],
            item["best_similarity"]
        ),
        reverse=True
    )

    best_candidate = candidates[0]

    best_similarity = (
        best_candidate["best_similarity"]
    )

    average_similarity = (
        best_candidate["average_similarity"]
    )

    if best_similarity < threshold:
        return None

    return {
        "student_id":
            best_candidate["student_id"],

        "student_name":
            best_candidate["student_name"],

        "similarity":
            float(best_similarity),

        "average_similarity":
            float(average_similarity),

        "match_count":
            int(best_candidate["match_count"])
    }


# =========================================================
# MODULE TEST
# =========================================================

if __name__ == "__main__":

    print(
        "MongoDB face recognition module loaded successfully."
    )

    total_faces = faces_collection.count_documents({})

    print(
        "Total stored face embeddings:",
        total_faces
    )

    if total_faces > 0:

        sample = faces_collection.find_one(
            {},
            {
                "student_id": 1,
                "student_name": 1,
                "image_index": 1,
                "embedding": 1
            }
        )

        print(
            "Student ID:",
            sample.get("student_id")
        )

        print(
            "Student Name:",
            sample.get("student_name")
        )

        print(
            "Image Index:",
            sample.get("image_index")
        )

        print(
            "Embedding Size:",
            len(
                sample.get(
                    "embedding",
                    []
                )
            )
        )

    print(
        "Cosine similarity function ready."
    )

    print(
        "Multi-embedding recognition function ready."
    )