function hasMain(code = "") {
  return /\bint\s+main\s*\(|\bmain\s*\(/.test(code);
}

function cppPrelude() {
  return `#include <bits/stdc++.h>
using namespace std;
`;
}

function wrapCpp(slug, userCode) {
  if (hasMain(userCode)) return userCode;

  const common = cppPrelude();

  switch (slug) {
    case "two-sum":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];
  int target; cin >> target;

  Solution s;
  auto ans = s.twoSum(nums, target);
  if (ans.size() >= 2) cout << ans[0] << " " << ans[1];
  return 0;
}
`;

    case "best-time-to-buy-sell-stock":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  vector<int> prices(n);
  for (int i = 0; i < n; i++) cin >> prices[i];

  Solution s;
  cout << s.maxProfit(prices);
  return 0;
}
`;

    case "maximum-subarray":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];

  Solution s;
  cout << s.maxSubArray(nums);
  return 0;
}
`;

    case "valid-palindrome":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  // read entire stdin as the string (can include spaces/punctuation)
  string s((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
  while (!s.empty() && (s.back() == '\\n' || s.back() == '\\r')) s.pop_back();

  Solution sol;
  cout << (sol.isPalindrome(s) ? "true" : "false");
  return 0;
}
`;

    case "longest-substring-without-repeating":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string s((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
  while (!s.empty() && (s.back() == '\\n' || s.back() == '\\r')) s.pop_back();

  Solution sol;
  cout << sol.lengthOfLongestSubstring(s);
  return 0;
}
`;

    case "reverse-linked-list":
      return `${common}
struct ListNode {
  int val;
  ListNode* next;
  ListNode(int x) : val(x), next(nullptr) {}
};

${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  ListNode* head = nullptr;
  ListNode* tail = nullptr;
  for (int i = 0; i < n; i++) {
    int x; cin >> x;
    auto* node = new ListNode(x);
    if (!head) head = tail = node;
    else { tail->next = node; tail = node; }
  }

  Solution sol;
  ListNode* out = sol.reverseList(head);

  bool first = true;
  for (auto* cur = out; cur; cur = cur->next) {
    if (!first) cout << " ";
    first = false;
    cout << cur->val;
  }
  return 0;
}
`;

    case "maximum-average-subarray":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, k;
  if (!(cin >> n >> k)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];

  Solution sol;
  double ans = sol.findMaxAverage(nums, k);
  // Print without trailing zeros (match seed outputs like 12.75 / 5.0)
  std::ostringstream oss;
  oss.setf(std::ios::fixed);
  oss << std::setprecision(10) << ans;
  std::string out = oss.str();
  if (out.find('.') != std::string::npos) {
    while (!out.empty() && out.back() == '0') out.pop_back();
    if (!out.empty() && out.back() == '.') out.pop_back();
  }
  cout << out;
  return 0;
}
`;

    case "container-with-most-water":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  vector<int> height(n);
  for (int i = 0; i < n; i++) cin >> height[i];

  Solution sol;
  cout << sol.maxArea(height);
  return 0;
}
`;

    case "binary-search":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, target;
  if (!(cin >> n >> target)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];

  Solution sol;
  cout << sol.search(nums, target);
  return 0;
}
`;

    case "climbing-stairs":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  Solution sol;
  cout << sol.climbStairs(n);
  return 0;
}
`;

    case "house-robber":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;
  if (!(cin >> n)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];

  Solution sol;
  cout << sol.rob(nums);
  return 0;
}
`;

    case "valid-parentheses":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string s((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
  while (!s.empty() && (s.back() == '\\n' || s.back() == '\\r')) s.pop_back();

  Solution sol;
  cout << (sol.isValid(s) ? "true" : "false");
  return 0;
}
`;

    case "maximum-depth-binary-tree":
      return `${common}
struct TreeNode {
  int val;
  TreeNode* left;
  TreeNode* right;
  TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

static TreeNode* buildTreeLevelOrder(const vector<string>& toks) {
  if (toks.empty() || toks[0] == "null") return nullptr;
  auto* root = new TreeNode(stoi(toks[0]));
  queue<TreeNode*> q;
  q.push(root);
  size_t i = 1;
  while (!q.empty() && i < toks.size()) {
    TreeNode* cur = q.front(); q.pop();
    if (i < toks.size() && toks[i] != "null") {
      cur->left = new TreeNode(stoi(toks[i]));
      q.push(cur->left);
    }
    i++;
    if (i < toks.size() && toks[i] != "null") {
      cur->right = new TreeNode(stoi(toks[i]));
      q.push(cur->right);
    }
    i++;
  }
  return root;
}

${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  vector<string> toks;
  string tok;
  while (cin >> tok) toks.push_back(tok);

  TreeNode* root = buildTreeLevelOrder(toks);
  Solution sol;
  cout << sol.maxDepth(root);
  return 0;
}
`;

    case "subarray-sum-equals-k":
      return `${common}
${userCode}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n, k;
  if (!(cin >> n >> k)) return 0;
  vector<int> nums(n);
  for (int i = 0; i < n; i++) cin >> nums[i];

  Solution sol;
  cout << sol.subarraySum(nums, k);
  return 0;
}
`;

    default:
      // Unknown slug: just provide standard headers to avoid missing includes.
      return `${common}
${userCode}
`;
  }
}

function wrapForProblem({ slug, language, code }) {
  if (!code) return code;
  if (language === "C++") return wrapCpp(slug, code);
  return code;
}

module.exports = { wrapForProblem };

