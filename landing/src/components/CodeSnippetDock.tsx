import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { copyText } from "../lib/clipboard";
import { Check, Copy, Terminal } from "lucide-react";

export const frameworks = [
  {
    id: "react",
    label: "React",
    file: "useVaultAuth.ts",
    install: "npm i @vaultauth/react",
    code: `// Quickstart example — adapt to your framework
const AUTH = "https://api.vaultauth.proplays2312.eu.org";

export function useVaultAuth() {
  const login = () => {
    const verifier = crypto.randomUUID();
    const challenge = base64url(sha256(verifier));
    location.href = AUTH + "/oauth/authorize?" + new URLSearchParams({
      response_type: "code",
      client_id: "your_client_id",
      redirect_uri: location.origin + "/callback",
      scope: "openid email profile",
      state: crypto.randomUUID(),
      code_challenge: challenge,
      code_challenge_method: "S256"
    });
  };
  return { login };
}`,
  },
  {
    id: "next",
    label: "Next.js",
    file: "middleware.ts",
    install: "npm i jose",
    code: `// Verify an RS256 ID token with the live JWKS
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL(
  "https://api.vaultauth.proplays2312.eu.org/.well-known/jwks.json"
));

export async function requireUser(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "https://api.vaultauth.proplays2312.eu.org",
    algorithms: ["RS256"]
  });
  return payload;
}`,
  },
  {
    id: "node",
    label: "Node.js",
    file: "guard.ts",
    install: "npm i jose",
    code: `import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL(
  "https://api.vaultauth.proplays2312.eu.org/.well-known/jwks.json"
));

export async function authGuard(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).end();
  const { payload } = await jwtVerify(token, JWKS);
  req.user = payload;
  next();
}`,
  },
  {
    id: "python",
    label: "Python",
    file: "auth.py",
    install: "pip install pyjwt cryptography",
    code: `import jwt
from jwt import PyJWKClient

JWKS = PyJWKClient(
    "https://api.vaultauth.proplays2312.eu.org/.well-known/jwks.json"
)

def verify(token: str) -> dict:
    key = JWKS.get_signing_key_from_jwt(token)
    return jwt.decode(
        token, key.key,
        algorithms=["RS256"],
        audience="your_client_id"
    )`,
  },
  {
    id: "go",
    label: "Go",
    file: "middleware.go",
    install: "go get github.com/golang-jwt/jwt/v5",
    code: `// Offline RS256 verification against a cached JWKS
func Auth(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    raw := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
    token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
      return cachedRS256PublicKey, nil
    })
    if err != nil || !token.Valid {
      http.Error(w, "unauthorized", http.StatusUnauthorized)
      return
    }
    next.ServeHTTP(w, r)
  })
}`,
  },
  {
    id: "java",
    label: "Java",
    file: "SecurityConfig.java",
    install: "implementation 'org.springframework.security:spring-security-oauth2-jose'",
    code: `@Bean
JwtDecoder jwtDecoder() {
  return NimbusJwtDecoder.withJwkSetUri(
    "https://api.vaultauth.proplays2312.eu.org/.well-known/jwks.json"
  ).jwsAlgorithm(SignatureAlgorithm.RS256).build();
}

@Bean
SecurityFilterChain filter(HttpSecurity http) throws Exception {
  return http.oauth2ResourceServer(o -> o.jwt(withDefaults())).build();
}`,
  },
  {
    id: "swift",
    label: "iOS / Swift",
    file: "LoginView.swift",
    install: "// Use ASWebAuthenticationSession",
    code: `let authURL = URL(string:
  "https://api.vaultauth.proplays2312.eu.org/oauth/authorize?" +
  "response_type=code&client_id=your_client_id" +
  "&code_challenge_method=S256&code_challenge=\\(challenge)"
)!

let session = ASWebAuthenticationSession(
  url: authURL,
  callbackURLScheme: "vaultauth"
) { callbackURL, error in
  guard let code = callbackURL?.queryItems?["code"] else { return }
  exchangeCodeForToken(code)
}
session.start()`,
  },
  {
    id: "curl",
    label: "cURL",
    file: "token.sh",
    install: "# No library required",
    code: `curl -X POST \\
  https://api.vaultauth.proplays2312.eu.org/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "your_client_id",
    "redirect_uri": "http://localhost:3000/callback",
    "code": "authorization_code_from_authorize",
    "code_verifier": "original_high_entropy_verifier"
  }'`,
  },
];

export function CodeSnippetDock() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const framework = frameworks[active];

  const copy = async () => {
    const ok = await copyText(framework.code);
    setCopied(ok);
    setCopyFailed(!ok);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1600);
  };

  return (
    <div className="w-full">
      {/* Semicircular capsule island */}
      <div className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#1E2838] bg-[#0E1420]/95 p-1.5 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.95)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {frameworks.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={active === index}
            className="relative shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors sm:px-4 sm:text-xs"
          >
            {active === index ? (
              <motion.span
                layoutId="snippet-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-[#F07A26]"
              />
            ) : null}
            <span className={`relative z-10 whitespace-nowrap ${active === index ? "va-amber-ink" : "text-[#94A3B8] hover:text-white"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="mt-4 overflow-hidden rounded-xl border border-[#1E2838] bg-[#060a11]">
        <div className="flex items-center gap-2 border-b border-[#1E2838] bg-[#0a0f18] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </span>
          <span className="ml-2 flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
            <Terminal className="h-3 w-3" /> {framework.file}
          </span>
          <button type="button" onClick={copy} className="ml-auto inline-flex items-center gap-1.5 rounded border border-[#1E2838] px-2 py-1 font-mono text-[10px] text-slate-400 hover:text-white">
            {copied ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : copyFailed ? "Try again" : "Copy"}
          </button>
        </div>
        <div className="border-b border-[#1E2838] bg-[#080d15] px-4 py-2 font-mono text-[10px] text-[#10B981]">
          $ {framework.install}
        </div>
        <AnimatePresence mode="wait">
          <motion.pre
            key={framework.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="min-h-[260px] overflow-x-auto p-4 font-mono text-[11px] leading-[1.8] text-slate-300 sm:p-5 sm:text-xs"
          >
            <code>{framework.code}</code>
          </motion.pre>
        </AnimatePresence>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-slate-500">
        Framework examples are illustrative — the live API endpoints and discovery document are real.
      </p>
    </div>
  );
}
