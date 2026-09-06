from datetime import datetime
from zoneinfo import ZoneInfo

from config.database import attendance_collection


def mark_attendance(student_id, student_name, similarity):

    # India ka current date/time
    india_time = datetime.now(ZoneInfo("Asia/Kolkata"))

    today = india_time.strftime("%Y-%m-%d")
    current_time = india_time.strftime("%H:%M:%S")

    # Check: aaj attendance already marked hai ya nahi
    existing = attendance_collection.find_one({
        "student_id": student_id,
        "date": today
    })

    if existing:
        return {
            "status": "ALREADY_MARKED",
            "message": "Attendance already marked today",
            "student_id": student_id,
            "student_name": student_name,
            "date": today,
            "time": existing["time"]
        }

    # New attendance record
    record = {
        "student_id": student_id,
        "student_name": student_name,
        "similarity": round(float(similarity), 4),
        "date": today,
        "time": current_time,
        "status": "PRESENT"
    }

    attendance_collection.insert_one(record)

    return {
        "status": "SUCCESS",
        "message": "Attendance marked successfully",
        **record
    }


# Test sirf tab chalega jab attendance.py ko directly run karein
if __name__ == "__main__":

    print("✅ Attendance module ready!")

    test_result = mark_attendance(
        student_id="101",
        student_name="Md Sajid Khan",
        similarity=0.8939
    )

    print("\n🎯 Attendance Test")
    print(test_result)