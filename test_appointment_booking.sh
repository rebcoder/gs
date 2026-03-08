#!/bin/bash

echo "=== TESTING APPOINTMENT BOOKING FUNCTIONALITY ==="
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

FRONTEND_URL="http://localhost:4200"
BACKEND_URL="http://localhost:8081"

echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo ""

# Test 1: Check if backend is running and can seed demo data
echo "📋 Test 1: Clearing and seeding demo data"
echo "curl -s -X POST $BACKEND_URL/api/test/clear-demo"
curl -s -X POST "$BACKEND_URL/api/test/clear-demo"
echo "curl -s -X POST $BACKEND_URL/api/test/seed-demo"
curl -s -X POST "$BACKEND_URL/api/test/seed-demo"
echo ""
echo ""

# Test 2: Get demo info to verify demo data
echo "📋 Test 2: Getting demo data information"
echo "curl -s $BACKEND_URL/api/test/demo-info"
curl -s "$BACKEND_URL/api/test/demo-info" | jq '.'

# Extract IDs from demo info (supports both old and new keys)
DEMO_INFO=$(curl -s "$BACKEND_URL/api/test/demo-info")
DEMO_USER1_ID=$(echo "$DEMO_INFO" | jq -r '.demoUser1Id // .sellerId')
DEMO_USER2_ID=$(echo "$DEMO_INFO" | jq -r '.demoUser2Id // .buyerId')
HOME_ID=$(echo "$DEMO_INFO" | jq -r '.homeId')
SALE_ID=$(echo "$DEMO_INFO" | jq -r '.saleId')
SALE_DATE_INFO=$(echo "$DEMO_INFO" | jq -r '.saleDate')

echo "Demo User 1 ID: $DEMO_USER1_ID"
echo "Demo User 2 ID: $DEMO_USER2_ID"
echo "Home ID: $HOME_ID"
echo "Sale ID: $SALE_ID"
echo ""

echo "📋 Test 2b: Logging in to obtain JWT (as demo_user2)"
LOGIN_PAYLOAD='{"username":"demo_user2","password":"demo123"}'
TOKEN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" -H "Content-Type: application/json" -d "$LOGIN_PAYLOAD" | jq -r '.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to obtain JWT token. Aborting."
  exit 1
fi
AUTH_HEADER="Authorization: Bearer $TOKEN"
echo "✅ Obtained JWT token"
echo ""
echo ""

# Test 3: Test appointment booking API directly
echo "📋 Test 3: Testing appointment booking API endpoint"

if [ "$SALE_ID" != "null" ] && [ -n "$SALE_ID" ]; then
  echo "Creating test appointment..."
  # Get sale date from demo-info for valid booking
  SALE_DATE=$SALE_DATE_INFO
  if [ "$SALE_DATE" = "null" ] || [ -z "$SALE_DATE" ]; then
    # fallback to sales list, then tomorrow if missing
    SALE_DATE=$(curl -s "$BACKEND_URL/api/garage-sales" | jq -r '.[] | select(.id=='"$SALE_ID"') | .saleDate')
    if [ "$SALE_DATE" = "null" ] || [ -z "$SALE_DATE" ]; then
      SALE_DATE=$(date -v+1d +%Y-%m-%d)
    fi
  fi
  APPT_TIME="${SALE_DATE}T14:00:00"
  APPOINTMENT_DATA='{
    "saleId": '$SALE_ID',
    "appointmentTime": "'$APPT_TIME'",
    "timeSlot": "14:00",
    "notes": "Test appointment via API",
    "sellerId": '$DEMO_USER1_ID',
    "homeId": '$HOME_ID'
  }'

  echo "Appointment data: $APPOINTMENT_DATA"
  echo ""

  RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/appointments" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$APPOINTMENT_DATA")

  echo "API Response: $RESPONSE" | jq '.' 2>/dev/null || echo "Raw: $RESPONSE"
  echo ""
else
  echo "❌ Sale ID not found, skipping appointment test"
fi

# Test 4: Check slot availability
echo "📋 Test 4: Testing slot availability check"
if [ "$SALE_ID" != "null" ] && [ -n "$SALE_ID" ]; then
  echo "Checking slot availability for 2:00 PM on sale date..."
  SLOT_RESPONSE=$(curl -s "$BACKEND_URL/api/appointments/slot-count?saleId=$SALE_ID&timeSlot=14:00&date=$SALE_DATE" -H "$AUTH_HEADER")
  echo "Slot count response: $SLOT_RESPONSE"
  echo ""
fi

# Test 5: Test appointment retrieval
echo "📋 Test 5: Testing appointment retrieval"
if [ "$DEMO_USER2_ID" != "null" ] && [ -n "$DEMO_USER2_ID" ]; then
  echo "Getting appointments for demo buyer..."
  APPOINTMENTS=$(curl -s "$BACKEND_URL/api/appointments/user/$DEMO_USER2_ID" -H "$AUTH_HEADER")
  echo "User appointments: $APPOINTMENTS" | jq '.' 2>/dev/null || echo "Raw: $APPOINTMENTS"
  echo ""
fi

# Test 6: Check sales endpoint
echo "📋 Test 6: Testing garage sales endpoint"
SALES=$(curl -s "$BACKEND_URL/api/garage-sales" -H "$AUTH_HEADER")
echo "Garage sales: $SALES" | jq '.[0]' 2>/dev/null || echo "Raw response: $SALES"
echo ""

echo "=== MANUAL TESTING INSTRUCTIONS ==="
echo ""
echo "🔍 Now please manually test the following in your browser:"
echo ""
echo "1. 🌐 Open: $FRONTEND_URL"
echo "2. 🔐 Login using demo credentials:"
echo "   - Username: demo_user"
echo "   - Password: demo123"
echo "3. 🏠 Browse to a garage sale detail page"
echo "4. 📅 Click the 'Book Appointment' button"
echo "5. 📝 Verify the appointment booking dialog opens with:"
echo "   - Sale information displayed"
echo "   - Date and time selection"
echo "   - Notes field"
echo "   - Item selection (if items exist)"
echo "   - Slot availability checking"
echo "6. ✅ Try booking an appointment and verify:"
echo "   - Form validation works"
echo "   - Success message appears"
echo "   - Redirects to appointments page"
echo ""
echo "🎯 Expected Results:"
echo "✅ Dialog opens as popup/modal (not full page)"
echo "✅ Form validation prevents submission with missing fields"
echo "✅ Slot availability is checked in real-time"
echo "✅ Appointment booking succeeds"
echo "✅ User is redirected to appointments page"
echo "✅ Success message is displayed"
echo ""

echo "=== TESTING COMPLETE ==="



