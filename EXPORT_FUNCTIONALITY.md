# Export Functionality - Hierarchical Role Management

## Overview

The SmartLearn University Management System provides comprehensive export functionality that respects the hierarchical role structure. Each role has specific export capabilities based on their administrative scope and responsibilities.

## Role Hierarchy

The system supports 5 user roles with increasing administrative scope:

1. **STUDENT** - Basic user, no export capabilities
2. **LECTURER** - Course-specific exports
3. **DEPARTMENT_ADMIN** - Department-level exports
4. **SCHOOL_ADMIN** - School-level exports
5. **SENATE_ADMIN** - System-wide exports

## Export Capabilities by Role

### 🎓 LECTURER

**Scope**: Students offering their assigned courses only

**Available Exports**:

- **Student List with Grades** (Excel/CSV)
  - Matric Number, First/Last Name, Department, Course details
  - CA Score, Exam Score, Total Score, Grade, Status
- **Student List Basic** (Excel/CSV)
  - Matric Number, First/Last Name, Department, Course details
  - No grade information

**API Endpoint**: `/api/lecturer/export-students`
**UI Location**: Lecturer Grades Page (`/dashboard/lecturer/grades/[courseId]`)

**Parameters**:

- `courseId` (required) - Course to export students for
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester
- `format` (optional) - "xlsx" or "csv" (default: "xlsx")
- `includeGrades` (optional) - "true" or "false" (default: "true")

### 🏢 DEPARTMENT_ADMIN

**Scope**: All students in their department

**Available Exports**:

- **Student List with Grades & CGPA** (Excel/CSV)
  - Complete student information with academic performance
  - CGPA, Academic Standing, Graduation eligibility
- **Student List Basic** (Excel/CSV)
  - Student names and details only
  - No grades or GPA information
- **Detailed Transcripts** (Excel/CSV/JSON)
  - Complete academic history across all sessions
  - Multiple sheets: Summary, Detailed Transcript, Session GPAs, Metadata

**API Endpoints**:

- `/api/admin/export-students` - Student lists
- `/api/admin/export-transcripts` - Detailed transcripts

**UI Location**: Result Approval Page (`/dashboard/result-approval`)

**Parameters**:

- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester
- `level` (optional) - Filter by student level
- `departmentId` (optional) - Filter by department (auto-restricted to admin's department)
- `format` (optional) - "xlsx", "csv", or "json" (default: "xlsx")
- `includeGrades` (optional) - "true" or "false" (default: "true")

### 🏫 SCHOOL_ADMIN

**Scope**: All students in their school (multiple departments)

**Available Exports**:

- **Student List with Grades & CGPA** (Excel/CSV)
  - All students across departments in their school
  - Complete academic performance data
- **Student List Basic** (Excel/CSV)
  - Student names and details only
- **Detailed Transcripts** (Excel/CSV/JSON)
  - Complete academic history for all students in school

**API Endpoints**:

- `/api/admin/export-students` - Student lists
- `/api/admin/export-transcripts` - Detailed transcripts

**UI Location**: Result Approval Page (`/dashboard/result-approval`)

**Parameters**: Same as Department Admin, but scope includes all departments in their school

### 🏛️ SENATE_ADMIN

**Scope**: All students across the entire university

**Available Exports**:

- **Student List with Grades & CGPA** (Excel/CSV)
  - All students across all schools and departments
  - Complete academic performance data
- **Student List Basic** (Excel/CSV)
  - Student names and details only
- **Detailed Transcripts** (Excel/CSV/JSON)
  - Complete academic history for all students

**API Endpoints**:

- `/api/admin/export-students` - Student lists
- `/api/admin/export-transcripts` - Detailed transcripts

**UI Location**: Result Approval Page (`/dashboard/result-approval`)

**Parameters**: Same as other admins, but scope includes all students in the system

## Export File Formats

### Excel (.xlsx)

- **Multi-sheet workbooks** with proper formatting
- **Column width optimization** for readability
- **Summary sheets** with export metadata
- **Compressed format** for efficient storage

### CSV (.csv)

- **Comma-separated values** for easy import
- **Proper escaping** of special characters
- **Header row** with column names
- **Lightweight format** for quick processing

### JSON (.json)

- **Structured data** for programmatic use
- **Complete object hierarchy** preserved
- **Metadata included** in export
- **API-friendly format**

## Security & Access Control

### Role-Based Restrictions

- **Lecturers**: Can only export students from courses they are assigned to
- **Department Admins**: Restricted to their department's students
- **School Admins**: Restricted to their school's students
- **Senate Admins**: Access to all students

### Data Privacy

- **Grade Information**: Only included when explicitly requested
- **Personal Data**: Limited to necessary academic information
- **Audit Trail**: All exports include generation metadata

### Authentication

- **Session-based**: Requires valid user session
- **Role Verification**: Server-side role validation
- **Permission Checks**: Database-level access control

## File Naming Convention

### Lecturer Exports

```
Students-{COURSE_CODE}-{ACADEMIC_YEAR}-{SEMESTER}-{with-grades|basic}.{format}
```

### Admin Exports

```
Students-{ACADEMIC_YEAR}-{SEMESTER}-{with-grades|basic}.{format}
Transcripts-{TIMESTAMP}.{format}
```

## UI Components

### Lecturer Interface

- **Export Excel (With Grades)** - Full student data with grades
- **Export Excel (Basic)** - Student list without grades
- **Export CSV (With Grades)** - CSV format with grades
- **Export CSV (Basic)** - CSV format without grades

### Admin Interface

- **Export Students (Excel)** - Student list with grades and CGPA
- **Export Basic List** - Student names and details only
- **Export Transcripts** - Complete academic transcripts

## Technical Implementation

### API Architecture

- **RESTful endpoints** with proper HTTP methods
- **Query parameter validation** and sanitization
- **Error handling** with appropriate HTTP status codes
- **Response streaming** for large file downloads

### Data Processing

- **Prisma ORM** for database queries
- **XLSX library** for Excel generation
- **CSV generation** with proper escaping
- **JSON serialization** for structured data

### Performance Optimization

- **Database indexing** on frequently queried fields
- **Pagination support** for large datasets
- **Memory-efficient** file generation
- **Compression** for Excel files

## Usage Examples

### Lecturer Exporting Course Students

```javascript
// Export with grades
const response = await fetch(
  "/api/lecturer/export-students?courseId=123&includeGrades=true&format=xlsx"
);

// Export basic list
const response = await fetch(
  "/api/lecturer/export-students?courseId=123&includeGrades=false&format=csv"
);
```

### Admin Exporting Department Students

```javascript
// Export with grades and CGPA
const response = await fetch(
  "/api/admin/export-students?includeGrades=true&format=xlsx"
);

// Export basic list
const response = await fetch(
  "/api/admin/export-students?includeGrades=false&format=csv"
);

// Export transcripts
const response = await fetch("/api/admin/export-transcripts?format=xlsx");
```

## Future Enhancements

### Planned Features

- **Scheduled exports** with email delivery
- **Custom field selection** for exports
- **Export templates** for different use cases
- **Bulk export operations** for multiple courses/departments
- **Export history tracking** and audit logs
- **Real-time export progress** indicators

### Integration Opportunities

- **Learning Management Systems** (LMS) integration
- **Student Information Systems** (SIS) compatibility
- **Academic reporting tools** connectivity
- **Data analytics platforms** integration

---

_This documentation reflects the current implementation as of the latest update. For technical support or feature requests, please contact the development team._
