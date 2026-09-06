import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Get MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

# Create MongoDB client
client = MongoClient(MONGO_URI)

# Select database
db = client["face_recognition_attendance"]

# Collections
students_collection = db["students"]
attendance_collection = db["attendance"]
faces_collection = db["faces"]
team_collection = db["team"]
users_collection = db["users"]
# Test MongoDB connection
try:
    client.admin.command("ping")
    print("MongoDB Connected Successfully!")
except Exception as e:
    print("MongoDB Connection Error:", e)