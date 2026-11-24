import { AnimatedCounter, FadeInValue } from "./ui/AnimatedCounter";
import { Reveal } from "./ui/primitives";

const offerings = [
  "Argon2id",
  "Email OTP",
  "Opaque Tokens",
  "Instant Revoke",
  "OIDC + PKCE",
  "RS256 JWKS",
  "RBAC Console",
  "Audit Trail",
  "Client Secrets",
  "30-Min Idle",
  "8-Hour Cap",
];

const benchmarks = [
  { value: 256, suffix: "-bit", label: "Opaque session tokens", detail: "Only the SHA-256 hash is persisted", fade: true },
  { value: 30, prefix: "<", suffix: "s", label: "Revocation propagation", detail: "Effective on the very next request", fade: false },
  { value: 3, label: "Strike lockout", detail: "Five-minute automatic account lock", fade: false },
  { value: 4, label: "Audit event families", detail: "Login, lockout, revocation, OAuth", fade: false },
];

export function StatsBanner() {
  return (
    <>
      <section className="border-y border-[#1E2838] bg-white/[0.015] py-12">
        <div className="va-container">
          <p className="text-center text-[13px] text-[#94A3B8]">What VaultAuth ships in every session</p>
          <div className="va-mask-x mt-8 overflow-hidden">
            <div className="va-marquee flex w-max items-center">
              {[0, 1].map((group) => (
                <div
                  key={group}
                  aria-hidden={group === 1}
                  className="flex shrink-0 items-center gap-14 pr-14"
                >
                  {offerings.map((offering, index) => (
                    <span
                      key={`${group}-${offering}-${index}`}
                      className="font-display text-xl font-bold tracking-[-0.03em] text-slate-600 transition-colors hover:text-white sm:text-2xl"
                    >
                      {offering}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="va-container py-20 sm:py-24">
        <Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-0">
            {benchmarks.map((item, index) => (
              <div
                key={item.label}
                className={`${index % 2 === 1 ? "border-l border-[#1E2838] pl-4 sm:border-l-0 sm:pl-0" : ""} ${
                  index > 0 ? "sm:border-l sm:border-[#1E2838] sm:pl-8" : ""
                }`}
              >
                <p className="font-display text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-[44px]">
                  {item.fade ? (
                    <FadeInValue value={item.value} prefix={item.prefix} suffix={item.suffix} />
                  ) : (
                    <AnimatedCounter value={item.value} prefix={item.prefix} suffix={item.suffix} />
                  )}
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-white sm:text-sm sm:leading-6">{item.label}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-[#94A3B8] sm:text-[13px] sm:leading-6">{item.detail}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
