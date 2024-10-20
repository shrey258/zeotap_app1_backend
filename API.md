# Rule Engine API Documentation

## Endpoints

### 1. Create Rule

- **URL:** `/api/rules/create`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "ruleString": "(age > 30 AND department = 'Sales') OR (salary > 50000)"
  }
  ```
- **Success Response:**
  - **Code:** 201
  - **Content:** `{ "message": "Rule created successfully", "rule": { ... } }`

### 2. Combine Rules

- **URL:** `/api/rules/combine`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "rules": ["ruleId1", "ruleId2"],
    "operator": "AND"
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Rules combined successfully", "rule": { ... } }`

### 3. Evaluate Rules

- **URL:** `/api/rules/evaluate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "data": {
      "age": 35,
      "department": "Sales",
      "salary": 60000
    }
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "results": [ { "ruleId": "...", "result": true }, ... ] }`

### 4. Get All Rules

- **URL:** `/api/rules`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200
  - **Content:** `[ { "ruleString": "...", "ast": { ... }, "createdAt": "..." }, ... ]`

