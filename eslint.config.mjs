import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // useEffect 내 setState — React 19에서 정상 패턴이지만 ESLint가 과잉 감지
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default eslintConfig
