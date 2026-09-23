from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from attendance_app.views import (
    # Authentication
    admin_login,
    admin_change_password,
    student_login,
    student_forgot_password,
    logout_api,
    current_user,

    # Student Management
    students,
    delete_student,
    update_student,

    # Student Portal
    student_profile,
    student_attendance,
    student_dashboard,
    student_change_password,

    # Attendance
    attendance,
    attendance_count,
    attendance_list,
    dashboard_stats,

    # Face Recognition
    face_recognition_api,
    face_register_api,

    # Team Management
    team_list,
    update_team_member,
    delete_team_member,
)


urlpatterns = [

    # ============================================================
    # AUTHENTICATION
    # ============================================================

    path(
        "admin/login/",
        admin_login,
        name="admin-login",
    ),

    path(
        "admin/change-password/",
        admin_change_password,
        name="admin-change-password",
    ),

    path(
        "student/login/",
        student_login,
        name="student-login",
    ),

    path(
        "student/forgot-password/",
        student_forgot_password,
        name="student-forgot-password",
    ),

    path(
        "logout/",
        logout_api,
        name="logout",
    ),

    path(
        "current-user/",
        current_user,
        name="current-user",
    ),

    # JWT token refresh
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),


    # ============================================================
    # DJANGO ADMIN
    # ============================================================

    path(
        "admin/",
        admin.site.urls,
    ),


    # ============================================================
    # STUDENT MANAGEMENT
    # ============================================================

    path(
        "students/",
        students,
        name="students",
    ),

    path(
        "students/<str:student_id>/",
        update_student,
        name="update-student",
    ),

    path(
        "students/<str:student_id>/delete/",
        delete_student,
        name="delete-student",
    ),


    # ============================================================
    # STUDENT PORTAL
    # ============================================================

    path(
        "student/profile/",
        student_profile,
        name="student-profile",
    ),

    path(
        "student/attendance/",
        student_attendance,
        name="student-attendance",
    ),

    path(
        "student/dashboard/",
        student_dashboard,
        name="student-dashboard",
    ),

    path(
        "student/change-password/",
        student_change_password,
        name="student-change-password",
    ),


    # ============================================================
    # ATTENDANCE
    # ============================================================

    path(
        "attendance/",
        attendance,
        name="attendance",
    ),

    path(
        "attendance-count/",
        attendance_count,
        name="attendance-count",
    ),

    path(
        "attendance-list/",
        attendance_list,
        name="attendance-list",
    ),

    path(
        "dashboard-stats/",
        dashboard_stats,
        name="dashboard-stats",
    ),


    # ============================================================
    # FACE RECOGNITION
    # ============================================================

    path(
        "face-recognition/",
        face_recognition_api,
        name="face-recognition",
    ),

    path(
        "face-register/",
        face_register_api,
        name="face-register",
    ),


    # ============================================================
    # TEAM MANAGEMENT
    # ============================================================

    path(
        "team/",
        team_list,
        name="team-list",
    ),

    path(
        "team/<str:team_id>/",
        update_team_member,
        name="update-team-member",
    ),

    path(
        "team/<str:team_id>/delete/",
        delete_team_member,
        name="delete-team-member",
    ),
]