from datetime import datetime
from zoneinfo import ZoneInfo

from config.database import attendance_collection


def mark_attendance(student_id, student_name, similarity):

    india_time = datetime.now(ZoneInfo("Asia/Kolkata"))

    today = india_time.strftime("%Y-%m-%d")
    current_time = india_time.strftime("%H:%M:%S")

    existing = attendance_collection.find_one({
        "student_id": str(student_id),
        "date": today
    })

    if existing:
        return {
            "status": "ALREADY_MARKED",
            "message": "Attendance already marked today",
            "student_id": str(student_id),
            "student_name": str(student_name),
            "date": today,
            "time": str(existing.get("time", ""))
        }

    record = {
        "student_id": str(student_id),
        "student_name": str(student_name),
        "similarity": round(float(similarity), 4),
        "date": today,
        "time": current_time,
        "status": "PRESENT"
    }

    attendance_collection.insert_one(record)

    return {
        "status": "SUCCESS",
        "message": "Attendance marked successfully",
        "student_id": record["student_id"],
        "student_name": record["student_name"],
        "similarity": record["similarity"],
        "date": record["date"],
        "time": record["time"],
        "status": record["status"]
    }