const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding problems...');

  const problems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'EASY',
      description: `
<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
`,
      defaultCode: {
        python: "import sys\nimport json\n\ndef solve():\n    # Read input from stdin\n    # Line 1: nums (e.g. [2,7,11,15])\n    # Line 2: target (e.g. 9)\n    lines = sys.stdin.readlines()\n    nums = json.loads(lines[0].strip())\n    target = int(lines[1].strip())\n    \n    # Write your logic here\n    # ...\n\nsolve()",
        javascript: "const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf8').split('\\n');\n    const nums = JSON.parse(input[0]);\n    const target = parseInt(input[1]);\n    \n    // Write your logic here\n}\n\nsolve();",
        cpp: "#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your logic here\n        return {};\n    }\n};\n\nint main() {\n    string line;\n    if (getline(cin, line)) {\n        line.erase(remove(line.begin(), line.end(), '['), line.end());\n        line.erase(remove(line.begin(), line.end(), ']'), line.end());\n        stringstream ss(line);\n        string num;\n        vector<int> nums;\n        while (getline(ss, num, ',')) nums.push_back(stoi(num));\n\n        int target; cin >> target;\n        Solution sol;\n        vector<int> res = sol.twoSum(nums, target);\n        cout << \"[\" << res[0] << \",\" << res[1] << \"]\" << endl;\n    }\n    return 0;\n}"
      },
      testCases: {
        create: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isSample: true },
          { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isSample: true },
          { input: '[3,3]\n6', expectedOutput: '[0,1]', isSample: false }
        ]
      }
    },
    {
      title: 'Reverse String',
      slug: 'reverse-string',
      difficulty: 'EASY',
      description: `
<p>Write a function that reverses a string. The input string is given as an array of characters <code>s</code>.</p>
`,
      defaultCode: {
        python: "import sys\nimport json\n\ndef solve():\n    s = json.loads(sys.stdin.read().strip())\n    # Logic here\n\nsolve()",
        javascript: "const fs = require('fs');\n\nfunction solve() {\n    const s = JSON.parse(fs.readFileSync(0, 'utf8').trim());\n    // Logic here\n}\n\nsolve();",
        cpp: "#include <iostream>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // Logic here\n    return 0;\n}"
      },
      testCases: {
        create: [
          { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isSample: true },
          { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isSample: true }
        ]
      }
    }
  ];

  for (const p of problems) {
    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        defaultCode: p.defaultCode
      },
      create: p,
    });
    console.log(`Updated problem: ${problem.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
