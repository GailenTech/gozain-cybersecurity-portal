#!/bin/bash

echo "Running all E2E tests..."
echo "========================"

# Run all tests and capture results
npx cypress run --reporter json > test_results.json 2>&1

# Extract summary
echo ""
echo "Test Summary:"
echo "============="
cat test_results.json | grep -E '"tests"|"passes"|"failures"|"pending"' | head -4

# Show failed specs if any
if grep -q '"failures": [1-9]' test_results.json; then
    echo ""
    echo "Failed Specs:"
    echo "============="
    cat test_results.json | grep -B2 '"state": "failed"' | grep '"title"' | cut -d'"' -f4
fi

echo ""
echo "Done!"