# Test Failures Analysis

## Summary
20 failing tests across the project (down from 22). Each test shows the expected value vs what is actually being received.

### Progress
- **Current Status**: 190/209 tests passing (90.9%)
- **Fixed**: test_create_milestone_without_project_id (ValidationError for missing query parameter)
- **In Progress**: Adding tags field to ProjectCreateUpdateSerializer response

---

## Milestone Tests (6 failures)

### 1. test_create_milestone_owner
**File:** `projects/tests/test_api_milestones.py:101`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

### 2. test_create_milestone_team_member
**File:** `projects/tests/test_api_milestones.py:116`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

### 3. test_create_milestone_logs_activity
**File:** `projects/tests/test_api_milestones.py:172`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

### 4. test_milestone_without_description
**File:** `projects/tests/test_api_milestones.py:413`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

### 5. test_milestone_due_date_past
**File:** `projects/tests/test_api_milestones.py:459`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

### 6. test_multiple_milestones_same_project
**File:** `projects/tests/test_api_milestones.py:428`
- **Expected:** `response.status_code == 201 (HTTP_201_CREATED)`
- **Actual:** Getting a different status code (likely 400 BAD_REQUEST)

---

## Project Tests (5 failures)

### 7. test_create_project_authenticated
**File:** `projects/tests/test_api_projects.py:221`
- **Expected:** `response.data["owner"]["id"] == self.owner.id`
- **Actual:** KeyError - `response.data["owner"]` field missing in response

### 8. test_create_project_with_tags
**File:** `projects/tests/test_api_projects.py:234`
- **Expected:** `len(response.data["tags"]) == 2`
- **Actual:** KeyError - `response.data["tags"]` field missing in response

### 9. test_create_project_logs_activity
**File:** `projects/tests/test_api_projects.py:273`
- **Expected:** `project_id = response.data["id"]` (extract ID from response)
- **Actual:** KeyError - `response.data["id"]` field missing in response

### 10. test_create_project_validates_title_required
**File:** `projects/tests/test_api_projects.py:257`
- **Expected:** `"title" in response.data` (error message for missing title field)
- **Actual:** Title field not being validated as required

### 11. test_update_project_add_tags
**File:** `projects/tests/test_api_projects.py:443`
- **Expected:** `self.project.tags.count() >= 2`
- **Actual:** Tags not being added/persisted to project

### 12. test_update_project_unrelated_user_cannot_edit
**File:** `projects/tests/test_api_projects.py:378`
- **Expected:** `response.status_code == 403 (HTTP_403_FORBIDDEN)`
- **Actual:** Different status code (likely 200 OK or 405 METHOD_NOT_ALLOWED)

---

## Comment Tests (5 failures)

### 13. test_list_comments_authorized
**File:** `projects/tests/test_comments.py:183`
- **Expected:** `len(response.data) == 1` (list of comments)
- **Actual:** `response.data` is not a list - likely paginated dictionary with `count`, `results`, `next`, `previous`

### 14. test_create_comment_exceeds_max_length
**File:** `projects/tests/test_comments.py:228`
- **Expected:** `response.status_code == 400 (HTTP_400_BAD_REQUEST)`
- **Actual:** Different status code (likely 201 CREATED - validation not enforced)

### 15. test_filter_comments_by_project
**File:** `projects/tests/test_comments.py:338`
- **Expected:** `len(response.data) == 1` (list of filtered comments)
- **Actual:** `response.data` not in expected format

### 16. test_update_comment_author
**File:** `projects/tests/test_comments.py:266`
- **Expected:** `comment.edit_count == 1` (edit_count incremented after update)
- **Actual:** `edit_count` field not being incremented

### 17. test_retrieve_comment
**File:** `projects/tests/test_comments.py:250`
- **Expected:** `len(response.data["replies"]) == 2`
- **Actual:** KeyError - `response.data["replies"]` field missing in response

---

## Changelog Tests (2 failures)

### 18. test_changelog_filtering_by_date_range
**File:** `projects/tests/test_changelog.py:205`
- **Expected:** `activity["description"] != "Old activity"` (old activities filtered out by date range)
- **Actual:** Old activities appearing in results when they should be excluded

### 19. test_changelog_permissions
**File:** `projects/tests/test_changelog.py:254`
- **Expected:** `response.status_code == 403 (HTTP_403_FORBIDDEN)` (unauthorized users blocked)
- **Actual:** Different status code (likely 200 OK - permissions not enforced)

---

## Integration/Workflow Tests (2 failures)

### 20. test_complete_project_creation_and_setup_workflow
**File:** `projects/tests/test_integration_workflows.py:70`
- **Expected:** `project_id = response.data["id"]` (extract ID from response)
- **Actual:** KeyError - `response.data["id"]` field missing in response

### 21. test_complete_audit_trail
**File:** `projects/tests/test_integration_workflows.py:362`
- **Expected:** All operation types present in audit trail
- **Actual:** Missing some operation types - `op not found in audit trail`

---

## Permission Tests (2 failures)

### 22. test_owner_can_create_milestone
**File:** `projects/tests/test_permissions.py`
- **Expected:** Owner should be able to create milestone successfully
- **Actual:** Permission denied or validation error preventing creation

---

## Common Patterns

### Missing Response Fields (7 tests)
Tests 7, 8, 9, 17, 20 fail because serializers don't include required fields in responses:
- `owner` field missing
- `tags` field missing
- `id` field missing
- `replies` field missing

### Pagination Issues (3 tests)
Tests 13, 15 expect list format but receive paginated dictionary - indicates global pagination is applied when it shouldn't be.

### Status Code Mismatches (6 tests)
Tests 1-6, 12, 14, 19 expect specific HTTP status codes but receive different ones.

### Validation/Permission Issues (3 tests)
Tests 10, 14, 19 - validations and permissions not being enforced properly.

### Data Persistence Issues (2 tests)
Tests 11, 16 - data not being saved/updated correctly.

### Date Filtering Issues (1 test)
Test 18 - date range filtering not working as expected.

### Operation Type Tracking (1 test)
Test 21 - audit trail missing certain operation types.
