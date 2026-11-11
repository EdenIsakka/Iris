export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'mobile',
        'api',
        'shared',
        'db',
        'ci',
        'docs',
        'deps',
        'transactions',
        'goals',
        'budgets',
        'auth',
      ],
    ],
  },
};
