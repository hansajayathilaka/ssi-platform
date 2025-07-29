/**
 * Basic test for Schema Management API endpoints
 * 
 * This test verifies that the schema management endpoints are working correctly.
 * Run with: node test/schema-management.test.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const CUSTOM_SCHEMAS_URL = `${BASE_URL}/schemas/custom`;

// Test schema data
const testSchema = {
  id: 'test-employee-schema',
  name: 'Test Employee Schema',
  version: '1.0.0',
  description: 'A test schema for employee credentials',
  fields: [
    {
      name: 'employeeId',
      type: 'string',
      required: true,
      displayName: 'Employee ID',
      description: 'Unique employee identifier',
      validation: [
        {
          type: 'pattern',
          value: '^EMP[0-9]{4}$',
          message: 'Employee ID must follow format EMP0000'
        }
      ]
    },
    {
      name: 'fullName',
      type: 'string',
      required: true,
      displayName: 'Full Name',
      description: 'Employee full name',
      validation: [
        {
          type: 'minLength',
          value: 2,
          message: 'Name must be at least 2 characters'
        }
      ]
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      displayName: 'Email Address',
      description: 'Employee email address'
    },
    {
      name: 'department',
      type: 'string',
      required: false,
      displayName: 'Department',
      description: 'Employee department'
    }
  ],
  metadata: {
    author: 'Test Author',
    organization: 'Test Organization',
    category: 'employee',
    tags: ['employee', 'test'],
    isActive: true,
    isPublic: true
  }
};

// Test credential data
const validCredentialData = {
  employeeId: 'EMP1234',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  department: 'Engineering'
};

const invalidCredentialData = {
  employeeId: 'INVALID',
  fullName: 'J',
  email: 'invalid-email'
};

async function runTests() {
  console.log('🧪 Starting Schema Management API Tests...\n');

  try {
    // Test 1: List custom schemas (should be empty initially)
    console.log('1. Testing GET /schemas/custom');
    const listResponse = await axios.get(CUSTOM_SCHEMAS_URL);
    console.log('✅ List schemas successful');
    console.log(`   Found ${listResponse.data.count} schemas\n`);

    // Test 2: Create a new custom schema
    console.log('2. Testing POST /schemas/custom');
    const createResponse = await axios.post(CUSTOM_SCHEMAS_URL, testSchema);
    console.log('✅ Create schema successful');
    console.log(`   Created schema: ${createResponse.data.data.name}\n`);

    // Test 3: Get schema by ID
    console.log('3. Testing GET /schemas/custom/:id');
    const getResponse = await axios.get(`${CUSTOM_SCHEMAS_URL}/${testSchema.id}`);
    console.log('✅ Get schema by ID successful');
    console.log(`   Retrieved schema: ${getResponse.data.data.name}\n`);

    // Test 4: Update the schema
    console.log('4. Testing PUT /schemas/custom/:id');
    const updatedSchema = { ...testSchema, description: 'Updated test schema description' };
    const updateResponse = await axios.put(`${CUSTOM_SCHEMAS_URL}/${testSchema.id}`, updatedSchema);
    console.log('✅ Update schema successful');
    console.log(`   Updated description: ${updateResponse.data.data.description}\n`);

    // Test 5: Validate valid credential data
    console.log('5. Testing POST /schemas/custom/:id/validate (valid data)');
    const validateValidResponse = await axios.post(
      `${CUSTOM_SCHEMAS_URL}/${testSchema.id}/validate`,
      validCredentialData
    );
    console.log('✅ Validate valid credential data successful');
    console.log(`   Validation result: ${validateValidResponse.data.data.isValid}\n`);

    // Test 6: Validate invalid credential data
    console.log('6. Testing POST /schemas/custom/:id/validate (invalid data)');
    const validateInvalidResponse = await axios.post(
      `${CUSTOM_SCHEMAS_URL}/${testSchema.id}/validate`,
      invalidCredentialData
    );
    console.log('✅ Validate invalid credential data successful');
    console.log(`   Validation result: ${validateInvalidResponse.data.data.isValid}`);
    console.log(`   Errors found: ${validateInvalidResponse.data.data.errors.length}\n`);

    // Test 7: List schemas again (should show our created schema)
    console.log('7. Testing GET /schemas/custom (after creation)');
    const listAfterResponse = await axios.get(CUSTOM_SCHEMAS_URL);
    console.log('✅ List schemas after creation successful');
    console.log(`   Found ${listAfterResponse.data.count} schemas\n`);

    // Test 8: Delete the schema
    console.log('8. Testing DELETE /schemas/custom/:id');
    const deleteResponse = await axios.delete(`${CUSTOM_SCHEMAS_URL}/${testSchema.id}`);
    console.log('✅ Delete schema successful');
    console.log(`   ${deleteResponse.data.message}\n`);

    // Test 9: Try to get deleted schema (should return 404)
    console.log('9. Testing GET /schemas/custom/:id (after deletion)');
    try {
      await axios.get(`${CUSTOM_SCHEMAS_URL}/${testSchema.id}`);
      console.log('❌ Expected 404 error but got success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly returned 404 for deleted schema\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Check if server is running before starting tests
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/ping`);
    console.log('✅ Server is running, starting tests...\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the credential server first.');
    console.error('   Run: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main();